import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';

const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const uploadDirSetting = process.env.UPLOAD_DIR || path.join(root, 'public', 'uploads');
const UPLOAD_DIR = path.isAbsolute(uploadDirSetting) ? uploadDirSetting : path.resolve(root, uploadDirSetting);

function createDbPool() {
  const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL || process.env.MYSQL_PRIVATE_URL || process.env.MYSQL_PUBLIC_URL;
  if (dbUrl) {
    try {
      const parsed = new URL(dbUrl);
      return mysql.createPool({
        host: parsed.hostname,
        port: Number(parsed.port || 3306),
        user: parsed.username,
        password: decodeURIComponent(parsed.password),
        database: parsed.pathname.replace(/^\//, '') || process.env.MYSQLDATABASE || process.env.DB_NAME || 'explore_lanka_db',
        waitForConnections: true,
        connectionLimit: 10,
        charset: 'utf8mb4',
        ssl: (process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true') ? { rejectUnauthorized: false } : undefined
      });
    } catch (e) {
      console.warn('Failed to parse database URL, falling back to individual environment variables:', e.message);
    }
  }
  return mysql.createPool({
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'explore_lanka_db',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
    ssl: (process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true') ? { rejectUnauthorized: false } : undefined
  });
}

const pool = createDbPool();

app.set('trust proxy', 1);
app.use((req,res,next) => {
  if (!['GET','HEAD','OPTIONS'].includes(req.method) && req.get('sec-fetch-site') === 'cross-site') return res.status(403).json({error:'Cross-site request blocked.'});
  next();
});
app.use(express.json({ limit: '8mb' }));

const isProd = process.env.NODE_ENV === 'production';
const cookieSecure = process.env.COOKIE_SECURE === 'true' || (isProd && process.env.COOKIE_SECURE !== 'false');

app.use(session({
  name: 'explore.sid',
  secret: process.env.SESSION_SECRET || 'local-development-change-this-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: cookieSecure,
    maxAge: 1000 * 60 * 60 * 12
  }
}));

const fail = (res, status, message) => res.status(status).json({ error: message });
const requireUser = async (req, res, next) => {
  if (!req.session.user) return fail(res, 401, 'Please log in to continue.');
  try {
    const [rows] = await pool.execute("SELECT * FROM users WHERE user_id=? AND status='active'", [req.session.user.user_id]);
    if (!rows.length) { req.session.destroy(() => {}); return fail(res, 401, 'Please sign in again.'); }
    req.session.user = safeUser(rows[0]); next();
  } catch (e) { next(e); }
};
const requireAdmin = (req, res, next) => req.session.user?.role === 'admin' ? next() : fail(res, 403, 'Administrator access is required.');
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const safeUser = (u) => ({
  user_id: u.user_id,
  fullname: u.fullname,
  username: u.username || null,
  email: u.email,
  phone: u.phone,
  bio: u.bio || '',
  city: u.city || '',
  country: u.country || 'Sri Lanka',
  role: u.role,
  profile_image: u.profile_image || null
});
const safeNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

app.post('/api/uploads/:kind', requireUser, asyncRoute(async (req, res) => {
  const kind = req.params.kind;
  if (!['profiles','posts','products','features','hotels','rooms'].includes(kind)) return fail(res,400,'Invalid image category.');
  if (!['profiles','posts'].includes(kind) && req.session.user.role !== 'admin') return fail(res,403,'Administrator access required.');
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(req.body?.image || ''));
  if (!match) return fail(res,400,'Choose a JPEG, PNG or WebP image.');
  const bytes = Buffer.from(match[2], 'base64');
  const valid = match[1] === 'jpeg' ? bytes.subarray(0,3).equals(Buffer.from([255,216,255])) : match[1] === 'png' ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : bytes.toString('ascii',0,4)==='RIFF' && bytes.toString('ascii',8,12)==='WEBP';
  if (!valid || bytes.length > 5*1024*1024) return fail(res,400,'Invalid image or file exceeds 5 MB.');
  const filename = `${crypto.randomUUID()}.${match[1] === 'jpeg' ? 'jpg' : match[1]}`;
  const directory = path.join(UPLOAD_DIR, kind);
  await fs.mkdir(directory,{recursive:true});
  await fs.writeFile(path.join(directory,filename),bytes,{flag:'wx'});
  if (kind === 'profiles') {
    await pool.execute('UPDATE users SET profile_image=? WHERE user_id=?',[filename,req.session.user.user_id]);
    req.session.user.profile_image=filename;
  }
  res.status(201).json({filename,url:`/uploads/${kind}/${filename}`});
}));

const healthHandler = asyncRoute(async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

app.get('/api/places', asyncRoute(async (req, res) => {
  const q = `%${String(req.query.search || '').trim()}%`;
  const district = String(req.query.district || '').trim();
  const category = String(req.query.category || '').trim();
  const [rows] = await pool.execute(
    `SELECT product_id, product_name, district, category, short_description, description, facilities, image
     FROM products WHERE status='active' AND (? = '%%' OR product_name LIKE ? OR district LIKE ? OR category LIKE ?)
     AND (? = '' OR district = ?) AND (? = '' OR category = ?)
     ORDER BY product_id ASC`, [q, q, q, q, district, district, category, category]
  );
  res.json(rows);
}));

app.get('/api/places/:id', asyncRoute(async (req, res) => {
  const [rows] = await pool.execute("SELECT * FROM products WHERE product_id=? AND status='active' LIMIT 1", [req.params.id]);
  if (!rows.length) return fail(res, 404, 'Destination not found.');
  const [reviews] = await pool.execute(
    `SELECT pf.feedback_id, pf.rating, pf.comment, pf.created_at, u.fullname
     FROM product_feedback pf JOIN users u ON u.user_id=pf.user_id
     WHERE pf.product_id=? AND pf.status='approved' ORDER BY pf.created_at DESC LIMIT 20`, [req.params.id]
  );
  res.json({ ...rows[0], reviews });
}));

const GALLERY_CATEGORIES = {
  'Adams Peak': 'Hill Country & Hiking',
  'Ella Rock': 'Hill Country & Hiking',
  'Nine Arches Bridge': 'Hill Country & Hiking',
  'Nuwara Eliya': 'Hill Country & Hiking',
  'Worlds End': 'Hill Country & Hiking',
  'Sigiriya': 'Heritage & Culture',
  'Galle Fort': 'Heritage & Culture',
  'Temple of the Tooth': 'Heritage & Culture',
  'Dambulla Cave Temple': 'Heritage & Culture',
  'Jaffna Fort': 'Heritage & Culture',
  'Mannar Fort': 'Heritage & Culture',
  'Nallur Kandaswamy Temple': 'Heritage & Culture',
  'Seetha Amman Temple': 'Heritage & Culture',
  'Yala National Park': 'Wildlife & Nature',
  'Udawalawe National Park': 'Wildlife & Nature',
  'Wilpattu National Park': 'Wildlife & Nature',
  'Minneriya National Park': 'Wildlife & Nature',
  'Kumana National Park': 'Wildlife & Nature',
  'Sinharaja Forest': 'Wildlife & Nature',
  'Peradeniya Gardens': 'Wildlife & Nature',
  'Mannar Baobab Tree': 'Wildlife & Nature',
  'Mirissa Beach': 'Coastal & Beaches',
  'Unawatuna Beach': 'Coastal & Beaches',
  'Arugam Bay': 'Coastal & Beaches',
  'Negombo Beach': 'Coastal & Beaches',
  'Kalpitiya Beach': 'Coastal & Beaches',
  'Marble Beach': 'Coastal & Beaches',
  'Madu River': 'Coastal & Beaches'
};
const VALID_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);

app.get('/api/gallery', asyncRoute(async (_req, res) => {
  const candidateDirs = [
    path.join(root, 'public', 'Tourist_Images'),
    path.join(root, 'Tourist_Images'),
    path.join(root, 'dist', 'Tourist_Images')
  ];
  let targetDir = candidateDirs[0];
  for (const candidate of candidateDirs) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isDirectory()) { targetDir = candidate; break; }
    } catch {}
  }
  let entries = [];
  try {
    entries = await fs.readdir(targetDir, { withFileTypes: true });
  } catch {
    return res.json({ destinations: [], categories: [], totalPhotos: 0 });
  }
  let products = [];
  try {
    const [rows] = await pool.query("SELECT product_id, product_name FROM products WHERE status='active'");
    products = rows;
  } catch {}
  const findProductId = (name) => {
    const n = name.toLowerCase();
    const found = products.find(p => {
      const pn = p.product_name.toLowerCase();
      return pn.includes(n) || n.includes(pn) || (n.includes('sigiriya') && pn.includes('sigiriya')) || (n.includes('tooth') && pn.includes('kandy'));
    });
    return found ? found.product_id : null;
  };
  const destinations = [];
  let totalPhotos = 0;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const folderName = entry.name;
    const subPath = path.join(targetDir, folderName);
    let files = [];
    try {
      files = await fs.readdir(subPath, { withFileTypes: true });
    } catch {
      continue;
    }
    const category = GALLERY_CATEGORIES[folderName] || 'Heritage & Culture';
    const productId = findProductId(folderName);
    const photos = files
      .filter(f => f.isFile() && VALID_IMAGE_EXTS.has(path.extname(f.name).toLowerCase()))
      .map((f, idx) => {
        const cleanTitle = path.basename(f.name, path.extname(f.name))
          .replace(/^\d+\.\s*/, '')
          .replace(/\d+$/, '')
          .trim();
        return {
          id: `${folderName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${idx + 1}`,
          filename: f.name,
          title: cleanTitle || folderName,
          url: `/Tourist_Images/${encodeURIComponent(folderName)}/${encodeURIComponent(f.name)}`,
          destination: folderName,
          category,
          productId
        };
      });
    if (photos.length > 0) {
      totalPhotos += photos.length;
      destinations.push({
        id: folderName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: folderName,
        category,
        productId,
        photoCount: photos.length,
        coverUrl: photos[0].url,
        photos
      });
    }
  }
  destinations.sort((a, b) => a.name.localeCompare(b.name));
  const categories = ['All', 'Heritage & Culture', 'Wildlife & Nature', 'Hill Country & Hiking', 'Coastal & Beaches'];
  res.json({ destinations, categories, totalPhotos });
}));

app.get('/api/features', asyncRoute(async (_req, res) => {
  const [rows] = await pool.execute("SELECT features_id, features_name, slug, description, facilities, image FROM features WHERE status='active' ORDER BY features_id");
  res.json(rows);
}));

app.get('/api/hotels/meta', asyncRoute(async (_req, res) => {
  const [districts] = await pool.query(
    "SELECT DISTINCT district FROM hotels WHERE status='active' ORDER BY district"
  );
  const [types] = await pool.query(
    "SELECT DISTINCT accommodation_type FROM hotels WHERE status='active' AND accommodation_type IS NOT NULL ORDER BY accommodation_type"
  );
  res.json({
    districts: districts.map(r => r.district),
    types: types.map(r => r.accommodation_type),
  });
}));

app.get('/api/hotels', asyncRoute(async (req, res) => {
  const q        = `%${String(req.query.search   || '').trim()}%`;
  const district = String(req.query.district || '').trim();
  const type     = String(req.query.type     || '').trim();
  const [rows] = await pool.execute(
    `SELECT h.hotel_id, h.hotel_name, h.slug, h.short_desc, h.city, h.district,
            h.star_category, h.grade, h.accommodation_type,
            h.licence_status, h.record_status, h.dataset_source,
            h.phone, h.mobile, h.email, h.website, h.booking_link,
            h.latitude, h.longitude, h.main_image, h.facilities,
            MIN(r.price_per_night) AS from_price,
            COUNT(DISTINCT r.room_id) AS room_types
     FROM hotels h
     LEFT JOIN hotel_rooms r ON r.hotel_id = h.hotel_id AND r.status = 'active'
     WHERE h.status = 'active'
       AND (? = '%%' OR h.hotel_name LIKE ? OR h.city LIKE ? OR h.district LIKE ?)
       AND (? = '' OR h.district = ?)
       AND (? = '' OR h.accommodation_type = ?)
     GROUP BY h.hotel_id
     ORDER BY
       CASE WHEN h.dataset_source = 'manual' THEN 0 ELSE 1 END ASC,
       h.star_category DESC,
       h.hotel_id ASC
     LIMIT 500`,
    [q, q, q, q, district, district, type, type]
  );
  res.json(rows);
}));

app.get('/api/hotels/:id', asyncRoute(async (req, res) => {
  const [hotels] = await pool.execute("SELECT * FROM hotels WHERE (hotel_id=? OR slug=?) AND status='active' LIMIT 1", [req.params.id, req.params.id]);
  if (!hotels.length) return fail(res, 404, 'Stay not found.');
  const [rooms] = await pool.execute("SELECT * FROM hotel_rooms WHERE hotel_id=? AND status='active' ORDER BY price_per_night", [hotels[0].hotel_id]);
  res.json({ ...hotels[0], rooms });
}));

app.post('/api/contact', asyncRoute(async (req, res) => {
  const { fullname, email, subject, message } = req.body || {};
  if (![fullname, email, subject, message].every((v) => typeof v === 'string' && v.trim()) || !/^\S+@\S+\.\S+$/.test(email)) {
    return fail(res, 400, 'Enter your name, a valid email, a subject, and a message.');
  }
  await pool.execute('INSERT INTO contacts(fullname,email,subject,message) VALUES(?,?,?,?)', [fullname.trim().slice(0,100), email.trim().slice(0,100), subject.trim().slice(0,200), message.trim()]);
  res.status(201).json({ message: 'Thanks for reaching out. Your message has been sent.' });
}));

app.get('/api/auth/me', (req, res) => res.json({ user: req.session.user ? safeUser(req.session.user) : null }));
app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const { fullname, email, password, phone = '' } = req.body || {};
  if (typeof fullname !== 'string' || fullname.trim().length < 2 || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string' || password.length < 8) {
    return fail(res, 400, 'Enter a name, valid email, and password with at least 8 characters.');
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    const [result] = await pool.execute("INSERT INTO users(fullname,email,password,phone,role,status) VALUES(?,?,?,?,'user','active')", [fullname.trim().slice(0,100), email.trim().toLowerCase(), hash, String(phone).trim().slice(0,20) || null]);
    const [users] = await pool.execute('SELECT * FROM users WHERE user_id=?', [result.insertId]);
    await new Promise((resolve, reject) => req.session.regenerate(err => err ? reject(err) : resolve()));
    req.session.user = safeUser(users[0]);
    res.status(201).json({ user: safeUser(users[0]) });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return fail(res, 409, 'That email address is already registered.');
    throw err;
  }
}));
app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const [rows] = await pool.execute("SELECT * FROM users WHERE email=? AND status='active' LIMIT 1", [email]);
  const user = rows[0];
  const hash = String(user?.password || '').replace(/^\$2y\$/, '$2b$');
  let verified = Boolean(user && await bcrypt.compare(password, hash));
  if (!verified) return fail(res, 401, 'Email or password is incorrect.');
  await new Promise((resolve, reject) => req.session.regenerate((err) => err ? reject(err) : resolve()));
  req.session.user = safeUser(user);
  res.json({ user: safeUser(user) });
}));
app.post('/api/auth/logout', (req, res) => req.session.destroy(() => { res.clearCookie('explore.sid'); res.json({ ok: true }); }));

app.get('/api/me', requireUser, (req, res) => res.json(safeUser(req.session.user)));
app.patch('/api/me', requireUser, asyncRoute(async (req, res) => {
  const fullname = String(req.body?.fullname || '').trim();
  const phone = String(req.body?.phone || '').trim();
  const bio = String(req.body?.bio || '').trim();
  const city = String(req.body?.city || '').trim();
  const country = String(req.body?.country || '').trim();
  if (fullname.length < 2) return fail(res, 400, 'Enter your name.');
  await pool.execute(
    'UPDATE users SET fullname=?, phone=?, bio=?, city=?, country=? WHERE user_id=?',
    [
      fullname.slice(0, 100),
      phone.slice(0, 20) || null,
      bio.slice(0, 500) || null,
      city.slice(0, 100) || null,
      country.slice(0, 100) || null,
      req.session.user.user_id
    ]
  );
  const [rows] = await pool.execute('SELECT * FROM users WHERE user_id=?', [req.session.user.user_id]);
  req.session.user = safeUser(rows[0]);
  res.json(safeUser(rows[0]));
}));

// =========================================================================
// COMMUNITY & FEED API ENDPOINTS — v2 (multi-media, social, messaging)
// =========================================================================

// Helper: check if userA is blocked by OR has blocked userB
async function isBlockedBetween(pool, userA, userB) {
  const [[row]] = await pool.execute(
    `SELECT COUNT(*) AS n FROM community_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?)`,
    [userA, userB, userB, userA]
  );
  return row.n > 0;
}

// Helper: check mutual friendship
async function isFriends(pool, userA, userB) {
  const [[row]] = await pool.execute(
    `SELECT COUNT(*) AS n FROM community_friend_requests
     WHERE status='accepted' AND (
       (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?)
     )`, [userA, userB, userB, userA]
  );
  return row.n > 0;
}

// Helper: attach media array to posts
async function attachMedia(pool, posts) {
  if (!posts.length) return posts;
  const ids = posts.map(p => p.post_id);
  const [media] = await pool.query(
    `SELECT post_id, url, kind, sort_order FROM community_post_media WHERE post_id IN (${ids.map(() => '?').join(',')}) ORDER BY post_id, sort_order ASC`,
    ids
  );
  const mediaMap = {};
  media.forEach(m => {
    if (!mediaMap[m.post_id]) mediaMap[m.post_id] = [];
    mediaMap[m.post_id].push({ url: m.url, kind: m.kind });
  });
  return posts.map(p => ({ ...p, media: mediaMap[p.post_id] || [] }));
}

// List community feed posts
app.get('/api/community/posts', asyncRoute(async (req, res) => {
  const currentUserId = req.session.user?.user_id || 0;
  const userRole = req.session.user?.role || '';
  const search = String(req.query.search || '').trim();
  const destination = String(req.query.destination || '').trim();
  const targetUserId = req.query.user_id ? Number(req.query.user_id) : 0;

  let where = "cp.status = 'active'";
  const params = [];

  if (search) {
    where += " AND (cp.content LIKE ? OR cp.destination_tag LIKE ? OR u.fullname LIKE ?)";
    const q = `%${search}%`;
    params.push(q, q, q);
  }
  if (destination) {
    where += " AND cp.destination_tag = ?";
    params.push(destination);
  }
  if (targetUserId) {
    where += " AND cp.user_id = ?";
    params.push(targetUserId);
  }

  const [posts] = await pool.execute(`
    SELECT
      cp.post_id, cp.user_id, cp.content, cp.image_url, cp.media_type, cp.destination_tag,
      cp.status, cp.created_at, cp.updated_at,
      u.fullname AS author_name, u.profile_image AS author_avatar,
      u.bio AS author_bio, u.role AS author_role,
      COALESCE(l.like_count, 0) AS like_count,
      COALESCE(c.comment_count, 0) AS comment_count,
      CASE WHEN ul.like_id IS NOT NULL THEN 1 ELSE 0 END AS is_liked
    FROM community_posts cp
    JOIN users u ON u.user_id = cp.user_id
    LEFT JOIN (SELECT post_id, COUNT(*) AS like_count FROM community_likes GROUP BY post_id) l ON l.post_id = cp.post_id
    LEFT JOIN (SELECT post_id, COUNT(*) AS comment_count FROM community_comments WHERE status='active' GROUP BY post_id) c ON c.post_id = cp.post_id
    LEFT JOIN community_likes ul ON ul.post_id = cp.post_id AND ul.user_id = ?
    WHERE ${where}
    ORDER BY cp.created_at DESC
    LIMIT 100
  `, [currentUserId, ...params]);

  const withMedia = await attachMedia(pool, posts);
  const result = withMedia.map(p => ({
    ...p,
    is_liked: Boolean(p.is_liked),
    can_edit: Boolean(currentUserId && (p.user_id === currentUserId || userRole === 'admin')),
    can_delete: Boolean(currentUserId && (p.user_id === currentUserId || userRole === 'admin'))
  }));

  res.json(result);
}));

// Upload media for posts (multi-file: up to 10 photos or 1 video)
app.post('/api/community/posts/upload-media', requireUser, asyncRoute(async (req, res) => {
  const files = Array.isArray(req.body?.files) ? req.body.files : [req.body?.files].filter(Boolean);
  const kind = String(req.body?.kind || 'photo');

  if (!['photo', 'video'].includes(kind)) return fail(res, 400, 'Invalid media kind.');
  if (kind === 'photo' && files.length > 10) return fail(res, 400, 'Maximum 10 photos per post.');
  if (kind === 'video' && files.length > 1) return fail(res, 400, 'Maximum 1 video per post.');

  const saved = [];
  for (const fileData of files) {
    const dataStr = String(fileData || '');
    if (kind === 'photo') {
      const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataStr);
      if (!match) return fail(res, 400, 'Invalid image format. Use JPEG, PNG or WebP.');
      const bytes = Buffer.from(match[2], 'base64');
      if (bytes.length > 10 * 1024 * 1024) return fail(res, 400, 'Image exceeds 10 MB.');
      const filename = `${crypto.randomUUID()}.${match[1] === 'jpeg' ? 'jpg' : match[1]}`;
      const dir = path.join(root, 'public', 'uploads', 'posts');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, filename), bytes, { flag: 'wx' });
      saved.push({ url: `/uploads/posts/${filename}`, kind: 'photo' });
    } else {
      const match = /^data:video\/(mp4|webm|ogg);base64,([A-Za-z0-9+/=]+)$/.exec(dataStr);
      if (!match) return fail(res, 400, 'Invalid video format. Use MP4, WebM or OGG.');
      const bytes = Buffer.from(match[2], 'base64');
      if (bytes.length > 100 * 1024 * 1024) return fail(res, 400, 'Video exceeds 100 MB.');
      const ext = match[1] === 'ogg' ? 'ogv' : match[1];
      const filename = `${crypto.randomUUID()}.${ext}`;
      const dir = path.join(root, 'public', 'uploads', 'videos');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, filename), bytes, { flag: 'wx' });
      saved.push({ url: `/uploads/videos/${filename}`, kind: 'video' });
    }
  }
  res.status(201).json({ files: saved });
}));

// Create a new post (with optional media attachments)
app.post('/api/community/posts', requireUser, asyncRoute(async (req, res) => {
  const content = String(req.body?.content || '').trim();
  const destination_tag = String(req.body?.destination_tag || '').trim().slice(0, 100) || null;
  // Legacy single image
  const image_url = String(req.body?.image_url || '').trim().slice(0, 400) || null;
  // New: array of { url, kind }
  const mediaFiles = Array.isArray(req.body?.media) ? req.body.media : [];

  if (!content) return fail(res, 400, 'Please write something for your post.');
  if (content.length > 3000) return fail(res, 400, 'Post content cannot exceed 3,000 characters.');
  if (mediaFiles.length > 10) return fail(res, 400, 'Maximum 10 media files per post.');

  const hasVideo = mediaFiles.some(m => m.kind === 'video');
  const mediaType = hasVideo ? 'video' : (mediaFiles.length > 0 ? 'photos' : (image_url ? 'photos' : 'none'));

  const [result] = await pool.execute(
    "INSERT INTO community_posts (user_id, content, image_url, media_type, destination_tag, status) VALUES (?, ?, ?, ?, ?, 'active')",
    [req.session.user.user_id, content, image_url, mediaType, destination_tag]
  );
  const postId = result.insertId;

  // Save media attachments
  if (mediaFiles.length > 0) {
    const mediaValues = mediaFiles.slice(0, 10).map((m, i) => [postId, String(m.url || '').slice(0, 400), m.kind === 'video' ? 'video' : 'photo', i]);
    for (const mv of mediaValues) {
      await pool.execute('INSERT INTO community_post_media (post_id, url, kind, sort_order) VALUES (?, ?, ?, ?)', mv);
    }
  }

  const [rows] = await pool.execute(`
    SELECT cp.post_id, cp.user_id, cp.content, cp.image_url, cp.media_type, cp.destination_tag,
      cp.status, cp.created_at, cp.updated_at,
      u.fullname AS author_name, u.profile_image AS author_avatar,
      u.bio AS author_bio, u.role AS author_role,
      0 AS like_count, 0 AS comment_count, 0 AS is_liked
    FROM community_posts cp
    JOIN users u ON u.user_id = cp.user_id
    WHERE cp.post_id = ?
  `, [postId]);

  const [mediaRows] = await pool.execute('SELECT url, kind, sort_order FROM community_post_media WHERE post_id=? ORDER BY sort_order', [postId]);

  const newPost = {
    ...rows[0],
    media: mediaRows.map(m => ({ url: m.url, kind: m.kind })),
    is_liked: false, can_edit: true, can_delete: true
  };

  res.status(201).json(newPost);
}));

// Edit an existing post
app.patch('/api/community/posts/:id', requireUser, asyncRoute(async (req, res) => {
  const postId = Number(req.params.id);
  const [posts] = await pool.execute("SELECT * FROM community_posts WHERE post_id=?", [postId]);
  if (!posts.length || posts[0].status === 'deleted') return fail(res, 404, 'Post not found.');

  const post = posts[0];
  const isOwner = post.user_id === req.session.user.user_id;
  const isAdmin = req.session.user.role === 'admin';
  if (!isOwner && !isAdmin) return fail(res, 403, 'You do not have permission to edit this post.');

  const content = String(req.body?.content || '').trim();
  const destination_tag = req.body?.destination_tag !== undefined ? (String(req.body.destination_tag).trim().slice(0, 100) || null) : post.destination_tag;
  const image_url = req.body?.image_url !== undefined ? (String(req.body.image_url).trim().slice(0, 400) || null) : post.image_url;
  const mediaFiles = Array.isArray(req.body?.media) ? req.body.media : null;

  if (!content) return fail(res, 400, 'Post content cannot be empty.');
  if (content.length > 3000) return fail(res, 400, 'Post content exceeds 3,000 characters.');

  let mediaType = post.media_type;
  if (mediaFiles !== null) {
    await pool.execute('DELETE FROM community_post_media WHERE post_id=?', [postId]);
    if (mediaFiles.length > 0) {
      const hasVideo = mediaFiles.some(m => m.kind === 'video');
      mediaType = hasVideo ? 'video' : 'photos';
      for (let i = 0; i < Math.min(mediaFiles.length, 10); i++) {
        const m = mediaFiles[i];
        await pool.execute('INSERT INTO community_post_media (post_id, url, kind, sort_order) VALUES (?, ?, ?, ?)',
          [postId, String(m.url || '').slice(0, 400), m.kind === 'video' ? 'video' : 'photo', i]);
      }
    } else {
      mediaType = image_url ? 'photos' : 'none';
    }
  }

  await pool.execute(
    "UPDATE community_posts SET content=?, destination_tag=?, image_url=?, media_type=?, updated_at=NOW() WHERE post_id=?",
    [content, destination_tag, image_url, mediaType, postId]
  );

  res.json({ updated: true, content, destination_tag, image_url, media_type: mediaType });
}));

// Delete a post
app.delete('/api/community/posts/:id', requireUser, asyncRoute(async (req, res) => {
  const postId = Number(req.params.id);
  const [posts] = await pool.execute("SELECT * FROM community_posts WHERE post_id=?", [postId]);
  if (!posts.length) return fail(res, 404, 'Post not found.');

  const post = posts[0];
  const isOwner = post.user_id === req.session.user.user_id;
  const isAdmin = req.session.user.role === 'admin';
  if (!isOwner && !isAdmin) return fail(res, 403, 'You do not have permission to delete this post.');

  await pool.execute("DELETE FROM community_likes WHERE post_id=?", [postId]);
  await pool.execute("DELETE FROM community_comments WHERE post_id=?", [postId]);
  await pool.execute("DELETE FROM community_post_media WHERE post_id=?", [postId]);
  await pool.execute("DELETE FROM community_posts WHERE post_id=?", [postId]);

  res.json({ deleted: true });
}));

// Like a post
app.post('/api/community/posts/:id/like', requireUser, asyncRoute(async (req, res) => {
  const postId = Number(req.params.id);
  const userId = req.session.user.user_id;
  const [posts] = await pool.execute("SELECT post_id FROM community_posts WHERE post_id=? AND status='active'", [postId]);
  if (!posts.length) return fail(res, 404, 'Post not found.');
  await pool.execute("INSERT IGNORE INTO community_likes (post_id, user_id) VALUES (?, ?)", [postId, userId]);
  const [[countRow]] = await pool.execute("SELECT COUNT(*) AS count FROM community_likes WHERE post_id=?", [postId]);
  res.json({ liked: true, like_count: countRow.count });
}));

// Unlike a post
app.delete('/api/community/posts/:id/like', requireUser, asyncRoute(async (req, res) => {
  const postId = Number(req.params.id);
  const userId = req.session.user.user_id;
  await pool.execute("DELETE FROM community_likes WHERE post_id=? AND user_id=?", [postId, userId]);
  const [[countRow]] = await pool.execute("SELECT COUNT(*) AS count FROM community_likes WHERE post_id=?", [postId]);
  res.json({ liked: false, like_count: countRow.count });
}));

// Get post media
app.get('/api/community/posts/:id/media', asyncRoute(async (req, res) => {
  const postId = Number(req.params.id);
  const [media] = await pool.execute('SELECT url, kind, sort_order FROM community_post_media WHERE post_id=? ORDER BY sort_order', [postId]);
  res.json(media);
}));

// Get comments for a post
app.get('/api/community/posts/:id/comments', asyncRoute(async (req, res) => {
  const postId = Number(req.params.id);
  const currentUserId = req.session.user?.user_id || 0;
  const userRole = req.session.user?.role || '';
  const [comments] = await pool.execute(`
    SELECT c.comment_id, c.post_id, c.user_id, c.content, c.status, c.created_at,
      u.fullname AS author_name, u.profile_image AS author_avatar, u.role AS author_role
    FROM community_comments c
    JOIN users u ON u.user_id = c.user_id
    WHERE c.post_id = ? AND c.status = 'active'
    ORDER BY c.created_at ASC
    LIMIT 200
  `, [postId]);
  const result = comments.map(c => ({
    ...c,
    can_edit: Boolean(currentUserId && (c.user_id === currentUserId || userRole === 'admin')),
    can_delete: Boolean(currentUserId && (c.user_id === currentUserId || userRole === 'admin'))
  }));
  res.json(result);
}));

// Add a comment
app.post('/api/community/posts/:id/comments', requireUser, asyncRoute(async (req, res) => {
  const postId = Number(req.params.id);
  const content = String(req.body?.content || '').trim();
  if (!content) return fail(res, 400, 'Comment cannot be empty.');
  if (content.length > 1000) return fail(res, 400, 'Comment exceeds 1,000 characters.');
  const [posts] = await pool.execute("SELECT post_id FROM community_posts WHERE post_id=? AND status='active'", [postId]);
  if (!posts.length) return fail(res, 404, 'Post not found.');
  const [result] = await pool.execute(
    "INSERT INTO community_comments (post_id, user_id, content, status) VALUES (?, ?, ?, 'active')",
    [postId, req.session.user.user_id, content]
  );
  const [rows] = await pool.execute(`
    SELECT c.comment_id, c.post_id, c.user_id, c.content, c.status, c.created_at,
      u.fullname AS author_name, u.profile_image AS author_avatar, u.role AS author_role
    FROM community_comments c JOIN users u ON u.user_id = c.user_id WHERE c.comment_id = ?
  `, [result.insertId]);
  res.status(201).json({ ...rows[0], can_edit: true, can_delete: true });
}));

// Edit comment
app.patch('/api/community/comments/:id', requireUser, asyncRoute(async (req, res) => {
  const commentId = Number(req.params.id);
  const [comments] = await pool.execute("SELECT * FROM community_comments WHERE comment_id=?", [commentId]);
  if (!comments.length || comments[0].status === 'deleted') return fail(res, 404, 'Comment not found.');
  const comment = comments[0];
  const isOwner = comment.user_id === req.session.user.user_id;
  const isAdmin = req.session.user.role === 'admin';
  if (!isOwner && !isAdmin) return fail(res, 403, 'Permission denied.');
  const content = String(req.body?.content || '').trim();
  if (!content) return fail(res, 400, 'Comment cannot be empty.');
  if (content.length > 1000) return fail(res, 400, 'Comment exceeds 1,000 characters.');
  await pool.execute("UPDATE community_comments SET content=?, updated_at=NOW() WHERE comment_id=?", [content, commentId]);
  res.json({ updated: true, comment: { ...comment, content } });
}));

// Delete comment
app.delete('/api/community/comments/:id', requireUser, asyncRoute(async (req, res) => {
  const commentId = Number(req.params.id);
  const [comments] = await pool.execute("SELECT * FROM community_comments WHERE comment_id=?", [commentId]);
  if (!comments.length) return fail(res, 404, 'Comment not found.');
  const comment = comments[0];
  const isOwner = comment.user_id === req.session.user.user_id;
  const isAdmin = req.session.user.role === 'admin';
  if (!isOwner && !isAdmin) return fail(res, 403, 'Permission denied.');
  await pool.execute("DELETE FROM community_comments WHERE comment_id=?", [commentId]);
  res.json({ deleted: true });
}));

// =========================================================================
// FOLLOW / FRIEND / SOCIAL ENDPOINTS
// =========================================================================

// Follow a user
app.post('/api/community/members/:id/follow', requireUser, asyncRoute(async (req, res) => {
  const targetId = Number(req.params.id);
  const userId = req.session.user.user_id;
  if (targetId === userId) return fail(res, 400, 'You cannot follow yourself.');
  if (await isBlockedBetween(pool, userId, targetId)) return fail(res, 403, 'Action not allowed.');
  await pool.execute("INSERT IGNORE INTO community_follows (follower_id, followee_id) VALUES (?, ?)", [userId, targetId]);
  const [[row]] = await pool.execute("SELECT COUNT(*) AS n FROM community_follows WHERE followee_id=?", [targetId]);
  res.json({ following: true, follower_count: row.n });
}));

// Unfollow a user
app.delete('/api/community/members/:id/follow', requireUser, asyncRoute(async (req, res) => {
  const targetId = Number(req.params.id);
  const userId = req.session.user.user_id;
  await pool.execute("DELETE FROM community_follows WHERE follower_id=? AND followee_id=?", [userId, targetId]);
  const [[row]] = await pool.execute("SELECT COUNT(*) AS n FROM community_follows WHERE followee_id=?", [targetId]);
  res.json({ following: false, follower_count: row.n });
}));

// Send friend request
app.post('/api/community/members/:id/friend-request', requireUser, asyncRoute(async (req, res) => {
  const receiverId = Number(req.params.id);
  const senderId = req.session.user.user_id;
  if (receiverId === senderId) return fail(res, 400, 'You cannot send yourself a friend request.');
  if (await isBlockedBetween(pool, senderId, receiverId)) return fail(res, 403, 'Action not allowed.');

  // Check if already friends
  if (await isFriends(pool, senderId, receiverId)) return res.json({ status: 'already_friends' });

  // Check for existing pending request either direction
  const [existing] = await pool.execute(
    "SELECT request_id, status, sender_id FROM community_friend_requests WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?)",
    [senderId, receiverId, receiverId, senderId]
  );
  if (existing.length) {
    const req2 = existing[0];
    if (req2.status === 'pending') {
      // If the other person sent a request to us, auto-accept
      if (req2.sender_id === receiverId) {
        await pool.execute("UPDATE community_friend_requests SET status='accepted', updated_at=NOW() WHERE request_id=?", [req2.request_id]);
        return res.json({ status: 'accepted' });
      }
      return res.json({ status: 'pending' });
    }
    if (req2.status === 'accepted') return res.json({ status: 'already_friends' });
    // declined: allow resend
    await pool.execute("UPDATE community_friend_requests SET status='pending', updated_at=NOW() WHERE request_id=?", [req2.request_id]);
    return res.json({ status: 'pending' });
  }

  await pool.execute("INSERT INTO community_friend_requests (sender_id, receiver_id, status) VALUES (?, ?, 'pending')", [senderId, receiverId]);
  res.status(201).json({ status: 'pending' });
}));

// Accept / Decline friend request
app.patch('/api/community/friend-requests/:id', requireUser, asyncRoute(async (req, res) => {
  const requestId = Number(req.params.id);
  const action = String(req.body?.action || '');
  if (!['accept', 'decline'].includes(action)) return fail(res, 400, 'Action must be accept or decline.');

  const [rows] = await pool.execute("SELECT * FROM community_friend_requests WHERE request_id=?", [requestId]);
  if (!rows.length) return fail(res, 404, 'Friend request not found.');
  const fr = rows[0];
  if (fr.receiver_id !== req.session.user.user_id) return fail(res, 403, 'Permission denied.');
  if (fr.status !== 'pending') return fail(res, 409, 'Request already resolved.');

  const newStatus = action === 'accept' ? 'accepted' : 'declined';
  await pool.execute("UPDATE community_friend_requests SET status=?, updated_at=NOW() WHERE request_id=?", [newStatus, requestId]);
  res.json({ status: newStatus });
}));

// Cancel own outgoing friend request
app.delete('/api/community/members/:id/friend-request', requireUser, asyncRoute(async (req, res) => {
  const receiverId = Number(req.params.id);
  const senderId = req.session.user.user_id;
  await pool.execute("DELETE FROM community_friend_requests WHERE sender_id=? AND receiver_id=? AND status='pending'", [senderId, receiverId]);
  res.json({ cancelled: true });
}));

// List incoming friend requests for current user
app.get('/api/community/friend-requests', requireUser, asyncRoute(async (req, res) => {
  const userId = req.session.user.user_id;
  const [rows] = await pool.execute(`
    SELECT fr.request_id, fr.sender_id, fr.created_at,
      u.fullname AS sender_name, u.profile_image AS sender_avatar, u.bio AS sender_bio
    FROM community_friend_requests fr
    JOIN users u ON u.user_id = fr.sender_id
    WHERE fr.receiver_id=? AND fr.status='pending'
    ORDER BY fr.created_at DESC
  `, [userId]);
  res.json(rows);
}));

// Block a user
app.post('/api/community/members/:id/block', requireUser, asyncRoute(async (req, res) => {
  const blockedId = Number(req.params.id);
  const blockerId = req.session.user.user_id;
  if (blockedId === blockerId) return fail(res, 400, 'You cannot block yourself.');
  await pool.execute("INSERT IGNORE INTO community_blocks (blocker_id, blocked_id) VALUES (?, ?)", [blockerId, blockedId]);
  // Also remove follows and pending friend requests between them
  await pool.execute("DELETE FROM community_follows WHERE (follower_id=? AND followee_id=?) OR (follower_id=? AND followee_id=?)", [blockerId, blockedId, blockedId, blockerId]);
  await pool.execute("DELETE FROM community_friend_requests WHERE ((sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?)) AND status='pending'", [blockerId, blockedId, blockedId, blockerId]);
  res.json({ blocked: true });
}));

// Unblock a user
app.delete('/api/community/members/:id/block', requireUser, asyncRoute(async (req, res) => {
  const blockedId = Number(req.params.id);
  const blockerId = req.session.user.user_id;
  await pool.execute("DELETE FROM community_blocks WHERE blocker_id=? AND blocked_id=?", [blockerId, blockedId]);
  res.json({ unblocked: true });
}));

// Report content (post / comment / user)
app.post('/api/community/reports', requireUser, asyncRoute(async (req, res) => {
  const reporterId = req.session.user.user_id;
  const targetType = String(req.body?.target_type || '');
  const targetId = Number(req.body?.target_id);
  const reason = String(req.body?.reason || 'inappropriate').trim().slice(0, 200);
  const notes = String(req.body?.notes || '').trim().slice(0, 1000) || null;

  if (!['post', 'comment', 'user'].includes(targetType)) return fail(res, 400, 'Invalid target type.');
  if (!targetId) return fail(res, 400, 'Invalid target ID.');

  try {
    await pool.execute(
      "INSERT INTO community_reports (reporter_id, target_type, target_id, reason, notes) VALUES (?, ?, ?, ?, ?)",
      [reporterId, targetType, targetId, reason, notes]
    );
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.json({ reported: true, alreadyReported: true });
    throw e;
  }
  res.status(201).json({ reported: true });
}));

// =========================================================================
// PRIVATE MESSAGES (friends only)
// =========================================================================

// Get conversation list for current user
app.get('/api/community/messages', requireUser, asyncRoute(async (req, res) => {
  const userId = req.session.user.user_id;
  const [rows] = await pool.execute(`
    SELECT 
      CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END AS partner_id,
      MAX(m.message_id) AS last_message_id,
      MAX(m.created_at) AS last_at,
      SUM(CASE WHEN m.receiver_id = ? AND m.is_read = 0 THEN 1 ELSE 0 END) AS unread_count
    FROM community_messages m
    WHERE m.sender_id = ? OR m.receiver_id = ?
    GROUP BY partner_id
    ORDER BY last_at DESC
    LIMIT 50
  `, [userId, userId, userId, userId]);

  if (!rows.length) return res.json([]);

  const partnerIds = rows.map(r => r.partner_id);
  const [partners] = await pool.query(
    `SELECT user_id, fullname, profile_image, bio FROM users WHERE user_id IN (${partnerIds.map(() => '?').join(',')})`,
    partnerIds
  );
  const partnerMap = Object.fromEntries(partners.map(p => [p.user_id, p]));

  // Get the last message text for each conversation
  const [lastMsgs] = await pool.query(
    `SELECT m.message_id, m.sender_id, m.receiver_id, m.content FROM community_messages m WHERE m.message_id IN (${rows.map(r => r.last_message_id).map(() => '?').join(',')})`,
    rows.map(r => r.last_message_id)
  );
  const lastMsgMap = Object.fromEntries(lastMsgs.map(m => [m.message_id, m]));

  const conversations = rows.map(r => {
    const partner = partnerMap[r.partner_id] || {};
    const lastMsg = lastMsgMap[r.last_message_id] || {};
    return {
      partner_id: r.partner_id,
      partner_name: partner.fullname || 'Unknown',
      partner_avatar: partner.profile_image || null,
      partner_bio: partner.bio || null,
      last_message: lastMsg.content || '',
      last_at: r.last_at,
      unread_count: r.unread_count || 0
    };
  });
  res.json(conversations);
}));

// Get message history with a specific user (friends only)
app.get('/api/community/messages/:partnerId', requireUser, asyncRoute(async (req, res) => {
  const userId = req.session.user.user_id;
  const partnerId = Number(req.params.partnerId);
  if (!(await isFriends(pool, userId, partnerId))) return fail(res, 403, 'You can only message accepted friends.');
  if (await isBlockedBetween(pool, userId, partnerId)) return fail(res, 403, 'Action not allowed.');

  const [messages] = await pool.execute(`
    SELECT message_id, sender_id, receiver_id, content, is_read, created_at
    FROM community_messages
    WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?)
    ORDER BY created_at ASC
    LIMIT 200
  `, [userId, partnerId, partnerId, userId]);

  // Mark incoming messages as read
  await pool.execute(
    "UPDATE community_messages SET is_read=1 WHERE receiver_id=? AND sender_id=? AND is_read=0",
    [userId, partnerId]
  );

  res.json(messages);
}));

// Send a message (friends only)
app.post('/api/community/messages/:partnerId', requireUser, asyncRoute(async (req, res) => {
  const userId = req.session.user.user_id;
  const partnerId = Number(req.params.partnerId);
  const content = String(req.body?.content || '').trim();

  if (!content) return fail(res, 400, 'Message cannot be empty.');
  if (content.length > 2000) return fail(res, 400, 'Message cannot exceed 2,000 characters.');
  if (!(await isFriends(pool, userId, partnerId))) return fail(res, 403, 'You can only message accepted friends.');
  if (await isBlockedBetween(pool, userId, partnerId)) return fail(res, 403, 'Action not allowed.');

  const [result] = await pool.execute(
    "INSERT INTO community_messages (sender_id, receiver_id, content) VALUES (?, ?, ?)",
    [userId, partnerId, content]
  );
  res.status(201).json({
    message_id: result.insertId,
    sender_id: userId,
    receiver_id: partnerId,
    content,
    is_read: 0,
    created_at: new Date().toISOString()
  });
}));

// Unread messages count
app.get('/api/community/messages-count', requireUser, asyncRoute(async (req, res) => {
  const userId = req.session.user.user_id;
  const [[row]] = await pool.execute(
    "SELECT COUNT(*) AS n FROM community_messages WHERE receiver_id=? AND is_read=0",
    [userId]
  );
  res.json({ unread: row.n });
}));

// Public member profile view (returns ONLY safe public fields + social data)
app.get('/api/community/members/:id', asyncRoute(async (req, res) => {
  const memberId = Number(req.params.id);
  const currentUserId = req.session.user?.user_id || 0;
  const userRole = req.session.user?.role || '';

  const [users] = await pool.execute(
    "SELECT user_id, fullname, username, bio, profile_image, city, country, role, created_at FROM users WHERE user_id=? AND status='active'",
    [memberId]
  );
  if (!users.length) return fail(res, 404, 'Member profile not found.');

  const member = users[0];

  const [[postCountRow]] = await pool.execute(
    "SELECT COUNT(*) AS count FROM community_posts WHERE user_id=? AND status='active'",
    [memberId]
  );

  const [[likeCountRow]] = await pool.execute(`
    SELECT COUNT(*) AS count 
    FROM community_likes l
    JOIN community_posts p ON p.post_id = l.post_id
    WHERE p.user_id = ? AND p.status = 'active'
  `, [memberId]);

  const [posts] = await pool.execute(`
    SELECT 
      cp.post_id,
      cp.user_id,
      cp.content,
      cp.image_url,
      cp.destination_tag,
      cp.status,
      cp.created_at,
      cp.updated_at,
      u.fullname AS author_name,
      u.profile_image AS author_avatar,
      u.bio AS author_bio,
      u.role AS author_role,
      COALESCE(l.like_count, 0) AS like_count,
      COALESCE(c.comment_count, 0) AS comment_count,
      CASE WHEN ul.like_id IS NOT NULL THEN 1 ELSE 0 END AS is_liked
    FROM community_posts cp
    JOIN users u ON u.user_id = cp.user_id
    LEFT JOIN (
      SELECT post_id, COUNT(*) AS like_count FROM community_likes GROUP BY post_id
    ) l ON l.post_id = cp.post_id
    LEFT JOIN (
      SELECT post_id, COUNT(*) AS comment_count FROM community_comments WHERE status='active' GROUP BY post_id
    ) c ON c.post_id = cp.post_id
    LEFT JOIN community_likes ul ON ul.post_id = cp.post_id AND ul.user_id = ?
    WHERE cp.user_id = ? AND cp.status = 'active'
    ORDER BY cp.created_at DESC
    LIMIT 50
  `, [currentUserId, memberId]);

  const formattedPosts = posts.map(p => ({
    ...p,
    is_liked: Boolean(p.is_liked),
    can_edit: Boolean(currentUserId && (p.user_id === currentUserId || userRole === 'admin')),
    can_delete: Boolean(currentUserId && (p.user_id === currentUserId || userRole === 'admin'))
  }));

  res.json({
    member: {
      user_id: member.user_id,
      fullname: member.fullname,
      username: member.username || null,
      bio: member.bio || null,
      profile_image: member.profile_image || null,
      city: member.city || null,
      country: member.country || 'Sri Lanka',
      role: member.role,
      joined_at: member.created_at,
      post_count: postCountRow.count,
      likes_received: likeCountRow.count
    },
    posts: formattedPosts
  });
}));

app.get('/api/me/favorites', requireUser, asyncRoute(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT a.add_id,a.features_name,p.product_id,p.district,p.category,p.short_description,p.image
     FROM adds a LEFT JOIN products p ON p.product_name=a.features_name
     WHERE a.user_id=? AND a.status='active' ORDER BY a.created_at DESC`, [req.session.user.user_id]
  );
  res.json(rows);
}));
app.post('/api/me/favorites', requireUser, asyncRoute(async (req, res) => {
  const id = safeNumber(req.body?.product_id);
  const [places] = await pool.execute("SELECT product_name FROM products WHERE product_id=? AND status='active'", [id]);
  if (!places.length) return fail(res, 404, 'Destination not found.');
  const name = places[0].product_name;
  const [saved] = await pool.execute("SELECT add_id FROM adds WHERE user_id=? AND features_name=? AND status!='removed' LIMIT 1", [req.session.user.user_id, name]);
  if (saved.length) return res.json({ saved: true, alreadySaved: true });
  const [removed] = await pool.execute("SELECT add_id FROM adds WHERE user_id=? AND features_name=? AND status='removed' LIMIT 1", [req.session.user.user_id, name]);
  if (removed.length) await pool.execute("UPDATE adds SET status='active' WHERE add_id=?", [removed[0].add_id]);
  else await pool.execute("INSERT INTO adds(user_id,features_name,status) VALUES(?,?,'active')", [req.session.user.user_id, name]);
  res.status(201).json({ saved: true });
}));
app.delete('/api/me/favorites/:id', requireUser, asyncRoute(async (req, res) => {
  const [result] = await pool.execute("UPDATE adds SET status='removed' WHERE add_id=? AND user_id=?", [req.params.id, req.session.user.user_id]);
  if (!result.affectedRows) return fail(res, 404, 'Saved destination not found.');
  res.json({ removed: true });
}));

app.get('/api/me/dashboard', requireUser, asyncRoute(async (req, res) => {
  const uid = req.session.user.user_id;
  const [[saved]] = await pool.execute("SELECT COUNT(*) AS total FROM adds WHERE user_id=? AND status='active'", [uid]);
  const [[bookings]] = await pool.execute("SELECT COUNT(*) AS total FROM bookings WHERE user_id=? AND status IN ('pending','confirmed')", [uid]);
  const [recent] = await pool.execute("SELECT add_id,features_name,created_at FROM adds WHERE user_id=? AND status='active' ORDER BY created_at DESC LIMIT 5", [uid]);
  res.json({ saved: saved.total, bookings: bookings.total, recent });
}));

app.post('/api/places/:id/reviews', requireUser, asyncRoute(async (req, res) => {
  const rating = safeNumber(req.body?.rating);
  const comment = String(req.body?.comment || '').trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail(res, 400, 'Choose a rating from 1 to 5.');
  await pool.execute("INSERT INTO product_feedback(product_id,user_id,rating,comment,status) VALUES(?,?,?,?,'pending')", [req.params.id, req.session.user.user_id, rating, comment.slice(0,2000) || null]);
  res.status(201).json({ message: 'Your review was sent for moderation.' });
}));

app.get('/api/me/bookings', requireUser, asyncRoute(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT b.*,h.hotel_name,h.city,r.room_name FROM bookings b
     JOIN hotels h ON h.hotel_id=b.hotel_id JOIN hotel_rooms r ON r.room_id=b.room_id
     WHERE b.user_id=? ORDER BY b.created_at DESC`, [req.session.user.user_id]
  );
  res.json(rows);
}));
app.post('/api/bookings', requireUser, asyncRoute(async (req, res) => {
  const { hotel_id, room_id, checkin_date, checkout_date, guests = 1, rooms_booked = 1, special_requests = '' } = req.body || {};
  const start = new Date(`${checkin_date}T00:00:00Z`);
  const end = new Date(`${checkout_date}T00:00:00Z`);
  const nights = Math.round((end - start) / 86400000);
  const roomCount = safeNumber(rooms_booked, 1);
  const guestCount = safeNumber(guests, 1);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkin_date) || !/^\d{4}-\d{2}-\d{2}$/.test(checkout_date) || !Number.isFinite(end.getTime()) || !Number.isInteger(roomCount) || !Number.isInteger(guestCount) || nights > 255 || !Number.isFinite(start.getTime()) || nights < 1 || start < new Date(`${new Date().toISOString().slice(0,10)}T00:00:00Z`) || roomCount < 1 || guestCount < 1) return fail(res, 400, 'Choose valid future check-in and check-out dates and a valid guest count.');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rooms] = await conn.execute("SELECT * FROM hotel_rooms WHERE room_id=? AND hotel_id=? AND status='active' FOR UPDATE", [room_id, hotel_id]);
    if (!rooms.length) { await conn.rollback(); return fail(res, 404, 'The selected room is unavailable.'); }
    const room = rooms[0];
    const [[busy]] = await conn.execute("SELECT COALESCE(SUM(rooms_booked),0) AS booked FROM bookings WHERE room_id=? AND status IN ('pending','confirmed') AND checkin_date < ? AND checkout_date > ?", [room_id, checkout_date, checkin_date]);
    if (guestCount > Number(room.capacity) * roomCount || Number(room.available_count) - Number(busy.booked) < roomCount) { await conn.rollback(); return fail(res, 409, 'There are not enough rooms for those dates or guests.'); }
    const price = Number(room.price_per_night);
    const total = price * nights * roomCount;
    const ref = `EL-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const [result] = await conn.execute(
      "INSERT INTO bookings(booking_ref,user_id,hotel_id,room_id,checkin_date,checkout_date,nights,guests,rooms_booked,price_per_night,total_amount,special_requests,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,'pending')",
      [ref, req.session.user.user_id, hotel_id, room_id, checkin_date, checkout_date, nights, guestCount, roomCount, price, total, String(special_requests).slice(0,2000) || null]
    );
    await conn.commit();
    res.status(201).json({ booking_id: result.insertId, booking_ref: ref, total_amount: total });
  } catch (err) { await conn.rollback(); throw err; }
  finally { conn.release(); }
}));
app.patch('/api/me/bookings/:id/cancel', requireUser, asyncRoute(async (req, res) => {
  const [result] = await pool.execute("UPDATE bookings SET status='cancelled',cancelled_by='user',updated_at=NOW() WHERE booking_id=? AND user_id=? AND status IN ('pending','confirmed')", [req.params.id, req.session.user.user_id]);
  if (!result.affectedRows) return fail(res, 409, 'This booking cannot be cancelled.');
  res.json({ cancelled: true });
}));

const adminResources = {
  places: { table: 'products', pk: 'product_id', cols: ['product_name','district','category','short_description','description','facilities','image','status','created_by'] },
  features: { table: 'features', pk: 'features_id', cols: ['features_name','slug','description','facilities','image','status','user'] },
  users: { table: 'users', pk: 'user_id', cols: ['fullname','email','phone','role','status'] },
  hotels: { table: 'hotels', pk: 'hotel_id', cols: ['hotel_name','slug','description','short_desc','address','city','district','accommodation_type','phone','mobile','email','website','booking_link','star_category','grade','registration_number','licence_status','record_status','checkin_time','checkout_time','main_image','facilities','status','dataset_source','created_by'] },
  rooms: { table: 'hotel_rooms', pk: 'room_id', cols: ['hotel_id','room_name','description','capacity','beds','bed_type','facilities','price_per_night','available_count','main_image','status'] },
  bookings: { table: 'bookings', pk: 'booking_id', cols: ['status','cancel_reason'] },
  contacts: { table: 'contacts', pk: 'contact_id', cols: ['status'] },
  reviews: { table: 'hotel_reviews', pk: 'review_id', cols: ['status'] },
  destinationReviews: { table: 'product_feedback', pk: 'feedback_id', cols: ['status'] }
};

app.get('/api/admin/summary', requireUser, requireAdmin, asyncRoute(async (_req, res) => {
  const [[users]] = await pool.query('SELECT COUNT(*) AS n FROM users');
  const [[places]] = await pool.query('SELECT COUNT(*) AS n FROM products');
  const [[hotels]] = await pool.query('SELECT COUNT(*) AS n FROM hotels');
  const [[bookings]] = await pool.query('SELECT COUNT(*) AS n FROM bookings');
  const [[messages]] = await pool.query("SELECT COUNT(*) AS n FROM contacts WHERE status='unread'");
  const [[destReviews]] = await pool.query("SELECT COUNT(*) AS n FROM product_feedback WHERE status='pending'");
  const [[hotelReviews]] = await pool.query("SELECT COUNT(*) AS n FROM hotel_reviews WHERE status='pending'");
  
  const [recentBookings] = await pool.query(
    `SELECT b.booking_id, b.booking_ref, b.checkin_date, b.checkout_date, b.total_amount, b.status, b.created_at,
            u.fullname AS user_name, h.hotel_name, r.room_name
     FROM bookings b
     LEFT JOIN users u ON u.user_id=b.user_id
     LEFT JOIN hotels h ON h.hotel_id=b.hotel_id
     LEFT JOIN hotel_rooms r ON r.room_id=b.room_id
     ORDER BY b.booking_id DESC LIMIT 5`
  );

  const [recentMessages] = await pool.query(
    `SELECT contact_id, fullname, email, subject, message, status, created_at
     FROM contacts
     ORDER BY contact_id DESC LIMIT 5`
  );

  const [recentReviews] = await pool.query(
    `SELECT pf.feedback_id AS id, 'destination' AS type, p.product_name AS target_name,
            COALESCE(NULLIF(u.fullname, ''), pf.fullname, 'Guest') AS author,
            pf.rating, pf.comment, pf.status, pf.created_at
     FROM product_feedback pf
     LEFT JOIN products p ON p.product_id=pf.product_id
     LEFT JOIN users u ON u.user_id=pf.user_id
     ORDER BY pf.feedback_id DESC LIMIT 5`
  );

  res.json({
    users: users.n,
    places: places.n,
    hotels: hotels.n,
    bookings: bookings.n,
    unreadMessages: messages.n,
    pendingReviews: destReviews.n + hotelReviews.n,
    pendingDestReviews: destReviews.n,
    pendingHotelReviews: hotelReviews.n,
    recentBookings,
    recentMessages,
    recentReviews
  });
}));

app.get('/api/admin/:resource', requireUser, requireAdmin, asyncRoute(async (req, res) => {
  const config = adminResources[req.params.resource];
  if (!config) return fail(res, 404, 'Unknown admin section.');
  
  let rows;
  if (req.params.resource === 'bookings') {
    [rows] = await pool.query(
      `SELECT b.*, u.fullname AS user_name, u.email AS user_email, h.hotel_name, r.room_name
       FROM bookings b
       LEFT JOIN users u ON u.user_id=b.user_id
       LEFT JOIN hotels h ON h.hotel_id=b.hotel_id
       LEFT JOIN hotel_rooms r ON r.room_id=b.room_id
       ORDER BY b.booking_id DESC LIMIT 500`
    );
  } else if (req.params.resource === 'reviews') {
    [rows] = await pool.query(
      `SELECT hr.*, h.hotel_name, u.fullname AS user_name, u.email AS user_email
       FROM hotel_reviews hr
       LEFT JOIN hotels h ON h.hotel_id=hr.hotel_id
       LEFT JOIN users u ON u.user_id=hr.user_id
       ORDER BY hr.review_id DESC LIMIT 500`
    );
  } else if (req.params.resource === 'destinationReviews') {
    [rows] = await pool.query(
      `SELECT pf.*, p.product_name, COALESCE(NULLIF(u.fullname, ''), pf.fullname, 'Guest') AS user_name, u.email AS user_email
       FROM product_feedback pf
       LEFT JOIN products p ON p.product_id=pf.product_id
       LEFT JOIN users u ON u.user_id=pf.user_id
       ORDER BY pf.feedback_id DESC LIMIT 500`
    );
  } else if (req.params.resource === 'rooms') {
    [rows] = await pool.query(
      `SELECT hr.*, h.hotel_name
       FROM hotel_rooms hr
       LEFT JOIN hotels h ON h.hotel_id=hr.hotel_id
       ORDER BY hr.room_id DESC LIMIT 500`
    );
  } else {
    [rows] = await pool.query(`SELECT * FROM ${config.table} ORDER BY ${config.pk} DESC LIMIT 500`);
  }

  if (req.params.resource === 'users') rows.forEach((row) => delete row.password);
  res.json(rows);
}));

app.post('/api/admin/:resource', requireUser, requireAdmin, asyncRoute(async (req, res) => {
  const config = adminResources[req.params.resource];
  if (!config || ['bookings','reviews','destinationReviews'].includes(req.params.resource)) return fail(res, 400, 'Use the relevant workflow to create this record.');
  const data = Object.fromEntries(Object.entries(req.body || {}).filter(([key, value]) => config.cols.includes(key) && value !== ''));
  if (!Object.keys(data).length) return fail(res, 400, 'Add at least one valid field.');
  if (req.params.resource === 'users') {
    if (!data.fullname || !data.email || !req.body.password) return fail(res, 400, 'New users need a name, email, and password.');
    if (String(req.body.password).length < 8) return fail(res, 400, 'Password must be at least 8 characters long.');
    data.password = await bcrypt.hash(String(req.body.password), 10);
  }
  if (['places','features','hotels'].includes(req.params.resource)) data.description ??= '';
  const fields = Object.keys(data).filter((key) => config.cols.includes(key) || (req.params.resource === 'users' && key === 'password'));
  const [result] = await pool.execute(`INSERT INTO ${config.table} (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`, fields.map((key) => data[key] ?? null));
  res.status(201).json({ id: result.insertId });
}));

app.patch('/api/admin/:resource/:id', requireUser, requireAdmin, asyncRoute(async (req, res) => {
  const config = adminResources[req.params.resource];
  if (!config) return fail(res, 404, 'Unknown admin section.');
  const data = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => config.cols.includes(key)));

  if (req.params.resource === 'users') {
    if ((data.role && data.role !== 'admin') || (data.status && data.status !== 'active')) {
      const [targetRows] = await pool.execute("SELECT role, status FROM users WHERE user_id=?", [req.params.id]);
      if (targetRows.length && targetRows[0].role === 'admin' && targetRows[0].status === 'active') {
        const [[adminCount]] = await pool.query("SELECT COUNT(*) AS n FROM users WHERE role='admin' AND status='active'");
        if (adminCount.n <= 1) {
          return fail(res, 400, 'Cannot demote or deactivate the last active administrator.');
        }
      }
    }
    if (req.body.password) {
      if (String(req.body.password).length < 8) return fail(res, 400, 'Password must be at least 8 characters long.');
      data.password = await bcrypt.hash(String(req.body.password), 10);
    }
  }

  if (!Object.keys(data).length) return fail(res, 400, 'No editable fields were provided.');
  const fields = Object.keys(data);
  const [result] = await pool.execute(`UPDATE ${config.table} SET ${fields.map((key) => `${key}=?`).join(',')} WHERE ${config.pk}=?`, [...fields.map((key) => data[key]), req.params.id]);
  if (!result.affectedRows) return fail(res, 404, 'Record not found.');
  res.json({ updated: true });
}));

app.delete('/api/admin/:resource/:id', requireUser, requireAdmin, asyncRoute(async (req, res) => {
  const config = adminResources[req.params.resource];
  if (!config) return fail(res, 404, 'Unknown admin section.');
  if (req.params.resource === 'users') return fail(res, 400, 'User accounts cannot be deleted. Deactivate account status instead.');
  if (req.params.resource === 'bookings') return fail(res, 400, 'Bookings cannot be deleted. Change status to cancelled instead.');
  if (['reviews','destinationReviews'].includes(req.params.resource)) return fail(res, 400, 'Reviews cannot be deleted. Change status to rejected or hidden instead.');
  
  const [result] = await pool.execute(`DELETE FROM ${config.table} WHERE ${config.pk}=?`, [req.params.id]);
  if (!result.affectedRows) return fail(res, 404, 'Record not found.');
  res.json({ deleted: true });
}));

app.use('/api', (_req, res) => fail(res, 404, 'API endpoint not found.'));
app.use('/assets', express.static(path.join(root, 'public/assets')));
app.use('/Tourist_Images', express.static(path.join(root, 'public/Tourist_Images')));
app.use('/Tourist_Images', express.static(path.join(root, 'Tourist_Images')));
app.use('/Tourist_Images', express.static(path.join(root, 'dist/Tourist_Images')));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/uploads', express.static(path.join(root, 'public/uploads')));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(root, 'dist')));
  app.get('*', (_req, res) => {
    const indexPath = path.join(root, 'dist', 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err && !res.headersSent) {
        res.status(404).send('Application build files not found. Run npm run build first.');
      }
    });
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Something went wrong.' : err.message });
});

const port = Number(process.env.PORT || 3000);
const host = '0.0.0.0';
app.listen(port, host, () => {
  console.log(`Explore Lanka server listening on ${host}:${port}`);
});
