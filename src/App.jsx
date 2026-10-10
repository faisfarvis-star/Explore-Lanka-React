import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

const AuthContext = createContext(null);
const api = async (url, options = {}) => {
  const response = await fetch(`/api${url}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
    body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Request failed.');
  return body;
};
// Single main-photo lookup (used on cards and as gallery hero fallback)
const photos = {
  'Sigiriya Rock Fortress': 'Sigiriya/1. Sigiriya Rock Fortress.jpg',
  'Ella': 'Ella Rock/Ella Rock2.jpg',
  'Galle Fort': 'Galle Fort/Galle Fort1.jpg',
  'Nuwara Eliya': 'Nuwara Eliya/Nuwara Eliya1.jpg',
  'Mirissa Beach': 'Mirissa Beach/Mirissa Beach 1.jpg',
  'Yala National Park': 'Yala National Park/Yala National Park1.jpg',
  'Kandy': 'Temple of the Tooth/Temple of the Tooth1.jpg',
  'Arugam Bay': 'Arugam Bay/Arugam Bay  1.jpg',
  'Nine Arch Bridge': 'Nine Arches Bridge/Nine Arches Bridge 1.jpg',
  'Horton Plains National Park': 'Worlds End/Worlds End 1.jpg',
  'Polonnaruwa Ancient City': 'Dambulla Cave Temple/Dambulla Cave Temple1.jpg',
  'Unawatuna Beach': 'Unawatuna Beach/Unawatuna Beach 1.jpg',
  "Adam's Peak (Sri Pada)": "Adams Peak/Adam's Peak (Sri Pada).jpg",
  'Dambulla Cave Temple': 'Dambulla Cave Temple/Dambulla Cave Temple1.jpg',
  'Ella Rock': 'Ella Rock/Ella Rock.jpg',
  'Jaffna Fort': 'Jaffna Fort/Jaffna Fort1.jpg',
  'Kalpitiya Beach': 'Kalpitiya Beach/Kalpitiya Beach 1.jpg',
  'Kumana National Park': 'Kumana National Park/Kumana National Park 1.jpg',
  'Madu River': 'Madu River/Madu River 1.jpg',
  'Mannar Baobab Tree': 'Mannar Baobab Tree/Mannar Baobab Tree  1.jpg',
  'Mannar Fort': 'Mannar Fort/Mannar Fort  1.jpg',
  'Marble Beach': 'Marble Beach/Marble Beach  1.jpg',
  'Minneriya National Park': 'Minneriya National Park/Minneriya National Park  2.jpg',
  'Nallur Kandaswamy Temple': 'Nallur Kandaswamy Temple/Nallur Kandaswamy Temple1.jpg',
  'Negombo Beach': 'Negombo Beach/Negombo Beach1.jpg',
  'Peradeniya Botanical Gardens': 'Peradeniya Gardens/Peradeniya Gardens1.jpg',
  'Seetha Amman Temple': 'Seetha Amman Temple/Seetha Amman Temple1.jpg',
  'Sinharaja Forest Reserve': 'Sinharaja Forest/Sinharaja Forest1.jpg',
  'Temple of the Tooth': 'Temple of the Tooth/Temple of the Tooth1.jpg',
  'Udawalawe National Park': 'Udawalawe National Park/Udawalawe National Park 1.jpg',
  'Wilpattu National Park': 'Wilpattu National Park/Wilpattu National Park1.jpg',
  "World's End": 'Worlds End/Worlds End 1.jpg',
  'Pinnawala Elephant Orphanage': 'Minneriya National Park/Minneriya National Park  3.jpg',
  'Pigeon Island National Park & Nilaveli Beach': 'Marble Beach/Marble Beach  2.jpg',
  'Anuradhapura Sacred Ancient City': 'Dambulla Cave Temple/Dambulla Cave Temple2.jpg',
  'Pasikuda Beach': 'Arugam Bay/Arugam Bay  2.jpg',
  'Bentota Beach & Water Sports Haven': 'Kalpitiya Beach/Kalpitiya Beach 2.jpg',
  'Little Adam\'s Peak': "Adams Peak/Adam's Peak (Sri Pada)2.jpg",
  'Koneswaram Temple Trincomalee': 'Nallur Kandaswamy Temple/Nallur Kandaswamy Temple2.jpg',
  'Lipton\'s Seat Haputale': 'Nuwara Eliya/Nuwara Eliya2.jpg',
  'Ravana Falls & Cave': 'Ella Rock/Ella Rock3.jpg',
  'Gangaramaya Temple & Seema Malaka': 'Temple of the Tooth/Temple of the Tooth2.jpg',
  'Hikkaduwa Coral Sanctuary & Surf Beach': 'Unawatuna Beach/Unawatuna Beach2.jpg'
};

// Full gallery lookup: product_name → ordered array of Tourist_Images paths
const placeGallery = {
  'Sigiriya Rock Fortress': [
    'Sigiriya/1. Sigiriya Rock Fortress.jpg',
    'Sigiriya/1. Sigiriya Rock Fortress2.jpg',
    'Sigiriya/1. Sigiriya Rock Fortress3.jpg',
    'Sigiriya/1. Sigiriya Rock Fortress4.jpg',
  ],
  'Ella': [
    'Ella Rock/Ella Rock2.jpg',
    'Ella Rock/Ella Rock.jpg',
    'Ella Rock/Ella Rock3.jpg',
  ],
  'Ella Rock': [
    'Ella Rock/Ella Rock.jpg',
    'Ella Rock/Ella Rock2.jpg',
    'Ella Rock/Ella Rock3.jpg',
  ],
  'Galle Fort': [
    'Galle Fort/Galle Fort1.jpg',
    'Galle Fort/Galle Fort2.jpg',
    'Galle Fort/Galle Fort3.jpg',
  ],
  'Nuwara Eliya': [
    'Nuwara Eliya/Nuwara Eliya1.jpg',
    'Nuwara Eliya/Nuwara Eliya2.jpg',
    'Nuwara Eliya/Nuwara Eliya3.jpg',
  ],
  'Mirissa Beach': [
    'Mirissa Beach/Mirissa Beach 1.jpg',
    'Mirissa Beach/Mirissa Beach2.jpg',
    'Mirissa Beach/Mirissa Beach3.jpg',
  ],
  'Yala National Park': [
    'Yala National Park/Yala National Park1.jpg',
    'Yala National Park/Yala National Park2.jpg',
    'Yala National Park/Yala National Park3.jpg',
  ],
  'Kandy': [
    'Temple of the Tooth/Temple of the Tooth1.jpg',
    'Temple of the Tooth/Temple of the Tooth2.jpg',
    'Temple of the Tooth/Temple of the Tooth3.jpg',
  ],
  'Arugam Bay': [
    'Arugam Bay/Arugam Bay  1.jpg',
    'Arugam Bay/Arugam Bay  2.jpg',
    'Arugam Bay/Arugam Bay  3.jpg',
  ],
  'Nine Arch Bridge': [
    'Nine Arches Bridge/Nine Arches Bridge 1.jpg',
    'Nine Arches Bridge/Nine Arches Bridg2.jpg',
    'Nine Arches Bridge/Nine Arches Bridg3.jpg',
  ],
  'Horton Plains National Park': [
    'Worlds End/Worlds End 1.jpg',
    'Worlds End/Worlds End2.jpg',
    'Worlds End/Worlds End3.jpg',
  ],
  'Polonnaruwa Ancient City': [
    'Dambulla Cave Temple/Dambulla Cave Temple1.jpg',
    'Dambulla Cave Temple/Dambulla Cave Temple2.jpg',
    'Dambulla Cave Temple/Dambulla Cave Temple3.jpg',
  ],
  'Unawatuna Beach': [
    'Unawatuna Beach/Unawatuna Beach 1.jpg',
    'Unawatuna Beach/Unawatuna Beach2.jpg',
    'Unawatuna Beach/Unawatuna Beach3.jpg',
  ],
  "Adam's Peak (Sri Pada)": [
    "Adams Peak/Adam's Peak (Sri Pada).jpg",
    "Adams Peak/Adam's Peak (Sri Pada)2.jpg",
    "Adams Peak/Adam's Peak (Sri Pada)3.jpg",
  ],
  'Dambulla Cave Temple': [
    'Dambulla Cave Temple/Dambulla Cave Temple1.jpg',
    'Dambulla Cave Temple/Dambulla Cave Temple2.jpg',
    'Dambulla Cave Temple/Dambulla Cave Temple3.jpg',
  ],
  'Jaffna Fort': [
    'Jaffna Fort/Jaffna Fort1.jpg',
    'Jaffna Fort/Jaffna Fort2.jpg',
    'Jaffna Fort/Jaffna Fort3.jpg',
  ],
  'Kalpitiya Beach': [
    'Kalpitiya Beach/Kalpitiya Beach 1.jpg',
    'Kalpitiya Beach/Kalpitiya Beach 2.jpg',
    'Kalpitiya Beach/Kalpitiya Beach 3.jpg',
  ],
  'Kumana National Park': [
    'Kumana National Park/Kumana National Park 1.jpg',
    'Kumana National Park/Kumana National Park 2.jpg',
    'Kumana National Park/Kumana National Park 3.jpg',
  ],
  'Madu River': [
    'Madu River/Madu River 1.jpg',
    'Madu River/Madu River 2.jpg',
    'Madu River/Madu River 3.jpg',
  ],
  'Mannar Baobab Tree': [
    'Mannar Baobab Tree/Mannar Baobab Tree  1.jpg',
    'Mannar Baobab Tree/Mannar Baobab Tree  2.jpg',
    'Mannar Baobab Tree/Mannar Baobab Tree  3.jpg',
  ],
  'Mannar Fort': [
    'Mannar Fort/Mannar Fort  1.jpg',
    'Mannar Fort/Mannar Fort  2.jpg',
    'Mannar Fort/Mannar Fort  3.jpg',
  ],
  'Marble Beach': [
    'Marble Beach/Marble Beach  1.jpg',
    'Marble Beach/Marble Beach  2.jpg',
    'Marble Beach/Marble Beach  3.jpg',
  ],
  'Minneriya National Park': [
    'Minneriya National Park/Minneriya National Park.jpg',
    'Minneriya National Park/Minneriya National Park  2.jpg',
    'Minneriya National Park/Minneriya National Park  3.jpg',
  ],
  'Nallur Kandaswamy Temple': [
    'Nallur Kandaswamy Temple/Nallur Kandaswamy Temple1.jpg',
    'Nallur Kandaswamy Temple/Nallur Kandaswamy Temple2.jpg',
    'Nallur Kandaswamy Temple/Nallur Kandaswamy Temple3.jpg',
  ],
  'Negombo Beach': [
    'Negombo Beach/Negombo Beach1.jpg',
    'Negombo Beach/Negombo Beach2.jpg',
    'Negombo Beach/Negombo Beach3.jpg',
  ],
  'Peradeniya Botanical Gardens': [
    'Peradeniya Gardens/Peradeniya Gardens1.jpg',
    'Peradeniya Gardens/Peradeniya Gardens2.jpg',
    'Peradeniya Gardens/Peradeniya Gardens3.jpg',
  ],
  'Seetha Amman Temple': [
    'Seetha Amman Temple/Seetha Amman Temple1.jpg',
    'Seetha Amman Temple/Seetha Amman Temple2.jpg',
    'Seetha Amman Temple/Seetha Amman Temple3.jpg',
  ],
  'Sinharaja Forest Reserve': [
    'Sinharaja Forest/Sinharaja Forest1.jpg',
    'Sinharaja Forest/Sinharaja Forest2.jpg',
    'Sinharaja Forest/Sinharaja Forest3.jpg',
  ],
  'Temple of the Tooth': [
    'Temple of the Tooth/Temple of the Tooth1.jpg',
    'Temple of the Tooth/Temple of the Tooth2.jpg',
    'Temple of the Tooth/Temple of the Tooth3.jpg',
  ],
  'Udawalawe National Park': [
    'Udawalawe National Park/Udawalawe National Park 1.jpg',
    'Udawalawe National Park/Udawalawe National Park2.jpg',
    'Udawalawe National Park/Udawalawe National Park3.jpg',
  ],
  'Wilpattu National Park': [
    'Wilpattu National Park/Wilpattu National Park1.jpg',
    'Wilpattu National Park/Wilpattu National Park2.jpg',
    'Wilpattu National Park/Wilpattu National Park3.jpg',
  ],
  "World's End": [
    'Worlds End/Worlds End 1.jpg',
    'Worlds End/Worlds End2.jpg',
    'Worlds End/Worlds End3.jpg',
  ],
  'Pinnawala Elephant Orphanage': [
    'Minneriya National Park/Minneriya National Park.jpg',
    'Minneriya National Park/Minneriya National Park  2.jpg',
    'Minneriya National Park/Minneriya National Park  3.jpg',
  ],
  'Pigeon Island National Park & Nilaveli Beach': [
    'Marble Beach/Marble Beach  1.jpg',
    'Marble Beach/Marble Beach  2.jpg',
    'Marble Beach/Marble Beach  3.jpg',
  ],
  'Anuradhapura Sacred Ancient City': [
    'Dambulla Cave Temple/Dambulla Cave Temple1.jpg',
    'Dambulla Cave Temple/Dambulla Cave Temple2.jpg',
    'Dambulla Cave Temple/Dambulla Cave Temple3.jpg',
  ],
  'Pasikuda Beach': [
    'Arugam Bay/Arugam Bay  1.jpg',
    'Arugam Bay/Arugam Bay  2.jpg',
    'Arugam Bay/Arugam Bay  3.jpg',
  ],
  'Bentota Beach & Water Sports Haven': [
    'Kalpitiya Beach/Kalpitiya Beach 1.jpg',
    'Kalpitiya Beach/Kalpitiya Beach 2.jpg',
    'Kalpitiya Beach/Kalpitiya Beach 3.jpg',
  ],
  'Little Adam\'s Peak': [
    "Adams Peak/Adam's Peak (Sri Pada).jpg",
    "Adams Peak/Adam's Peak (Sri Pada)2.jpg",
    "Adams Peak/Adam's Peak (Sri Pada)3.jpg",
  ],
  'Koneswaram Temple Trincomalee': [
    'Nallur Kandaswamy Temple/Nallur Kandaswamy Temple1.jpg',
    'Nallur Kandaswamy Temple/Nallur Kandaswamy Temple2.jpg',
    'Nallur Kandaswamy Temple/Nallur Kandaswamy Temple3.jpg',
  ],
  'Lipton\'s Seat Haputale': [
    'Nuwara Eliya/Nuwara Eliya1.jpg',
    'Nuwara Eliya/Nuwara Eliya2.jpg',
    'Nuwara Eliya/Nuwara Eliya3.jpg',
  ],
  'Ravana Falls & Cave': [
    'Ella Rock/Ella Rock.jpg',
    'Ella Rock/Ella Rock2.jpg',
    'Ella Rock/Ella Rock3.jpg',
  ],
  'Gangaramaya Temple & Seema Malaka': [
    'Temple of the Tooth/Temple of the Tooth1.jpg',
    'Temple of the Tooth/Temple of the Tooth2.jpg',
    'Temple of the Tooth/Temple of the Tooth3.jpg',
  ],
  'Hikkaduwa Coral Sanctuary & Surf Beach': [
    'Unawatuna Beach/Unawatuna Beach 1.jpg',
    'Unawatuna Beach/Unawatuna Beach2.jpg',
    'Unawatuna Beach/Unawatuna Beach3.jpg',
  ],
};

// Given a product_name, return an array of full /Tourist_Images/… URLs
function galleryFor(name) {
  const paths = placeGallery[name];
  if (!paths || !paths.length) return [];
  return paths.map(p => `/Tourist_Images/${encodePath(p)}`);
}
const districtPhotos = {
  Matale: 'Sigiriya/1. Sigiriya Rock Fortress.jpg',
  Badulla: 'Ella Rock/Ella Rock2.jpg',
  Galle: 'Galle Fort/Galle Fort1.jpg',
  Matara: 'Mirissa Beach/Mirissa Beach 1.jpg',
  Hambantota: 'Yala National Park/Yala National Park1.jpg',
  Kandy: 'Temple of the Tooth/Temple of the Tooth1.jpg',
  Ampara: 'Arugam Bay/Arugam Bay  1.jpg',
  'Nuwara Eliya': 'Nuwara Eliya/Nuwara Eliya1.jpg',
  Colombo: 'Negombo Beach/Negombo Beach1.jpg',
  Jaffna: 'Jaffna Fort/Jaffna Fort1.jpg',
  Puttalam: 'Kalpitiya Beach/Kalpitiya Beach 1.jpg',
  Mannar: 'Mannar Fort/Mannar Fort  1.jpg',
  Trincomalee: 'Marble Beach/Marble Beach  1.jpg',
  Polonnaruwa: 'Dambulla Cave Temple/Dambulla Cave Temple1.jpg',
  Gampaha: 'Negombo Beach/Negombo Beach1.jpg',
  Ratnapura: 'Sinharaja Forest/Sinharaja Forest1.jpg',
  Kegalle: 'Minneriya National Park/Minneriya National Park  3.jpg',
  Anuradhapura: 'Dambulla Cave Temple/Dambulla Cave Temple2.jpg',
  Batticaloa: 'Arugam Bay/Arugam Bay  2.jpg',
  Kalutara: 'Kalpitiya Beach/Kalpitiya Beach 2.jpg'
};

function encodePath(pathStr = '') {
  return pathStr.split('/').filter(Boolean).map(encodeURIComponent).join('/');
}

const HOTEL_PLACEHOLDER = '/assets/images/placeholders/hotel-placeholder.svg';
const DESTINATION_PLACEHOLDER = '/assets/images/placeholders/placeholder.svg';

function isHotelItem(item = {}) {
  return Boolean(
    item.hotel_name ||
    item.hotel_id ||
    item.accommodation_type ||
    item.star_category !== undefined ||
    item.rooms !== undefined ||
    item.dataset_source !== undefined
  );
}

function photoFor(item = {}) {
  const isHotel = isHotelItem(item);
  const raw = String(item.image || item.main_image || '').trim();

  if (isHotel) {
    // If it's a hotel or stay, dataset-imported hotels have no verified photo
    if (item.dataset_source === 'sltda_import') {
      return HOTEL_PLACEHOLDER;
    }
    if (raw) {
      // Must NOT be a Tourist_Images reference (destination photo)
      if (raw.startsWith('/Tourist_Images/') || raw.startsWith('Tourist_Images/') || raw.includes('Tourist_Images')) {
        return HOTEL_PLACEHOLDER;
      }
      // Verified external photo URL
      if (/^https?:\/\//i.test(raw)) {
        return raw;
      }
      // Uploaded hotel photo
      if (raw.startsWith('/uploads/') || raw.startsWith('uploads/')) {
        if (raw.includes('/products/')) {
          return HOTEL_PLACEHOLDER;
        }
        const sub = raw.replace(/^\/?uploads\//, '');
        return `/uploads/${encodePath(sub)}`;
      }
    }
    // No verified property photo exists — use clean branded "Photo coming soon" placeholder
    return HOTEL_PLACEHOLDER;
  }

  // Destination / experience photos
  if (raw) {
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith('/Tourist_Images/') || raw.startsWith('Tourist_Images/')) {
      const sub = raw.replace(/^\/?Tourist_Images\//, '');
      return `/Tourist_Images/${encodePath(sub)}`;
    }
    if (raw.startsWith('/uploads/') || raw.startsWith('uploads/')) {
      const sub = raw.replace(/^\/?uploads\//, '');
      return `/uploads/${encodePath(sub)}`;
    }
    if (raw.includes('/')) {
      return `/Tourist_Images/${encodePath(raw)}`;
    }
  }

  const mapped = photos[item.product_name] ||
                 districtPhotos[item.district] ||
                 'Sigiriya/1. Sigiriya Rock Fortress.jpg';
  return `/Tourist_Images/${encodePath(mapped)}`;
}
function UploadImage({kind,onUploaded}) {
 const [message,setMessage]=useState('');
 async function upload(e) {
  const file=e.target.files[0]; if(!file)return;
  if(file.size>5*1024*1024){setMessage('Maximum image size is 5 MB.');return;}
  setMessage('Uploading…');
  try {const image=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
   const result=await api(`/uploads/${kind}`,{method:'POST',body:{image}});onUploaded(result.filename);setMessage('Image uploaded.');
  }catch(e){setMessage(e.message);}
 }
 return <label>Upload image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload}/><small role="status">{message}</small></label>;
}
function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  useEffect(() => {
    let active = true;
    setState({ data: null, loading: true, error: '' });
    loader().then(data => active && setState({ data, loading: false, error: '' }))
      .catch(error => active && setState({ data: null, loading: false, error: error.message }));
    return () => { active = false; };
  }, deps);
  return state;
}
function useToast() {
  const context = useContext(AuthContext);
  return context.toast;
}

function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [toast, setToast] = useState('');
  useEffect(() => {
    api('/auth/me').then(({ user }) => setUser(user)).catch(() => {}).finally(() => setAuthReady(true));
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3600);
    return () => clearTimeout(timer);
  }, [toast]);
  const value = useMemo(() => ({ user, setUser, toast: setToast }), [user]);
  return <AuthContext.Provider value={value}>
    <Header />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/places" element={<Places />} />
      <Route path="/places/:id" element={<PlaceDetail />} />
      <Route path="/hotels" element={<Hotels />} />
      <Route path="/hotels/:id" element={<HotelDetail />} />
      <Route path="/features" element={<Features />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/feed" element={<Protected user={user} ready={authReady}><CommunityFeed /></Protected>} />
      <Route path="/community/members/:id" element={<MemberProfile />} />
      <Route path="/community/messages" element={<Protected user={user} ready={authReady}><CommunityMessaging /></Protected>} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<AuthForm mode="login" authReady={authReady} />} />
      <Route path="/register" element={<AuthForm mode="register" authReady={authReady} />} />
      <Route path="/dashboard" element={<Protected user={user} ready={authReady}><Dashboard /></Protected>} />
      <Route path="/favorites" element={<Protected user={user} ready={authReady}><Favorites /></Protected>} />
      <Route path="/bookings" element={<Protected user={user} ready={authReady}><Bookings /></Protected>} />
      <Route path="/profile" element={<Protected user={user} ready={authReady}><Profile /></Protected>} />
      <Route path="/admin" element={<Protected user={user} ready={authReady} admin><Admin /></Protected>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    <Footer />
    {toast && <div className="toast" role="status">{toast}</div>}
  </AuthContext.Provider>;
}

function Header() {
  const { user, setUser } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('explore_lanka_theme') === 'dark');
  const location = useLocation();
  const isHome = location.pathname === '/';
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('explore_lanka_theme', dark ? 'dark' : 'light');
  }, [dark]);
  const close = () => setMenuOpen(false);
  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    setUser(null); close();
  }
  return <header className={`site-header ${isHome ? 'site-header--home' : 'site-header--inner'}`}><div className="nav-shell">
    <Link to="/" className="brand" onClick={close}><span className="brand-mark">✳</span><span>Explore <b>Lanka</b><small>THE ISLAND GUIDE</small></span></Link>
    <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">☰</button>
    <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
      <NavLink to="/places" onClick={close}>Places</NavLink><NavLink to="/hotels" onClick={close}>Stays</NavLink><NavLink to="/features" onClick={close}>Experiences</NavLink><NavLink to="/gallery" onClick={close}>Gallery</NavLink><NavLink to="/feed" onClick={close}>Community</NavLink>{user && <NavLink to="/community/messages" onClick={close}>Messages</NavLink>}<NavLink to="/about" onClick={close}>About</NavLink><NavLink to="/contact" onClick={close}>Contact</NavLink>{user?.role === 'admin' && <NavLink to="/admin" onClick={close}>Admin</NavLink>}
      <button className="theme-switch" onClick={() => setDark(!dark)} aria-label="Toggle light or dark theme">{dark ? '☀' : '☾'}</button>
      {user ? <div className="nav-user"><NavLink to="/dashboard" onClick={close}>{user.fullname.split(' ')[0]}</NavLink><button className="nav-logout" onClick={logout}>Log out</button></div> : <Link className="nav-cta" to="/login" onClick={close}>Sign in <span>↗</span></Link>}
    </nav>
  </div></header>;
}
function Footer() {
  return <footer className="site-footer"><div className="footer-inner"><div><Link to="/" className="brand footer-brand"><span className="brand-mark">✳</span><span>Explore <b>Lanka</b><small>THE ISLAND GUIDE</small></span></Link><p>Find the places, stays and moments that make Sri Lanka unforgettable.</p></div><div className="footer-nav"><Link to="/places">Destinations</Link><Link to="/hotels">Stays</Link><Link to="/features">Experiences</Link><Link to="/gallery">Gallery</Link><Link to="/feed">Community</Link><Link to="/contact">Contact</Link></div><small>© {new Date().getFullYear()} Explore Lanka</small></div></footer>;
}
function Protected({ user, ready, admin = false, children }) {
  const location = useLocation();
  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}
function Loading() { return <div className="page-state">Loading…</div>; }
function ErrorState({ message }) { return <div className="page-state error-state">{message}<p>Check that the API server and MySQL database are running.</p></div>; }
function PageIntro({ tag, title, text }) { return <section className="page-intro"><p className="eyebrow">{tag}</p><h1>{title}</h1>{text && <p>{text}</p>}</section>; }
function ImageCard({ item, type = 'place' }) {
  const isHotel = type === 'hotel' || isHotelItem(item);
  const fallbackSrc = isHotel ? HOTEL_PLACEHOLDER : DESTINATION_PLACEHOLDER;
  return <Link to={`/${isHotel ? 'hotels' : 'places'}/${isHotel ? item.slug || item.hotel_id : item.product_id}`} className="image-card">
    <div className="card-image"><img onError={e => { e.currentTarget.onerror=null; e.currentTarget.src=fallbackSrc; }} src={photoFor(item)} alt={item.product_name || item.hotel_name} loading="lazy" /><span className="image-label">{isHotel ? `${item.star_category || 3} star stay` : item.category || item.district}</span><span className="image-arrow">↗</span></div>
    <div className="card-body"><div className="card-title"><h3>{item.product_name || item.hotel_name}</h3>{isHotel && item.from_price && <span>From LKR {Number(item.from_price).toLocaleString()}</span>}</div><p>{item.short_description || item.short_desc || item.district || item.city}</p><span className="card-link">Explore details <b>→</b></span></div>
  </Link>;
}
function Home() {
  const { data: places, loading, error } = useAsync(() => api('/places').then(rows => rows.slice(0, 6)), []);
  const { data: features } = useAsync(() => api('/features'), []);
  return <main>
    <section className="hero"><div className="hero-copy"><p className="eyebrow">Your island story starts here</p><h1>One island.<br /><em>A thousand ways to feel alive.</em></h1><p>Climb ancient citadels, drift through tea country, meet the wild, and end the day beside the Indian Ocean.</p><div className="hero-actions"><Link className="button button-gold" to="/places">Explore the island <span>→</span></Link><Link className="under-link" to="/hotels">Find a place to stay ↗</Link></div><div className="hero-note">✳ &nbsp;Small island. Big feeling.</div></div><figure className="hero-photo"><img src="/Tourist_Images/Sigiriya/1.%20Sigiriya%20Rock%20Fortress.jpg" alt="Sigiriya Rock rising over the forest"/><figcaption><small>THE CULTURAL TRIANGLE</small><b>Sigiriya, Matale</b></figcaption></figure><a className="scroll-note" href="#island-picks">Scroll to explore ↓</a></section>
    <section className="search-band"><form onSubmit={e => { e.preventDefault(); const q = new FormData(e.currentTarget).get('search'); window.location.href = `/places?search=${encodeURIComponent(q)}`; }}><div><small>START EXPLORING</small><b>Where would you like to go?</b></div><input name="search" placeholder="Try Sigiriya, Ella, Jaffna…" aria-label="Search destinations"/><button className="button button-green">Search <span>→</span></button></form></section>
    <section className="section" id="island-picks"><div className="section-heading"><div><p className="eyebrow eyebrow-dark">A good place to begin</p><h2>Find your kind of island.</h2></div><Link className="text-link" to="/places">All destinations ↗</Link></div>{error ? <ErrorState message={error} /> : loading ? <Loading /> : <div className="card-grid">{places?.map((p, i) => <ImageCard item={p} key={p.product_id} />)}</div>}</section>
    <section className="feature-band"><div className="feature-intro"><p className="eyebrow">More than a destination</p><h2>Take the scenic route.</h2><p>Find the details that make your Sri Lankan journey feel like yours.</p><Link to="/features" className="light-link">See how we help →</Link></div><div className="feature-list">{features?.slice(0, 4).map((f, i) => <div className="feature-line" key={f.features_id}><small>0{i + 1}</small><div><b>{f.features_name}</b><p>{f.description}</p></div><span>↗</span></div>)}</div></section>
    <section className="closing"><p className="eyebrow">Your story is out there</p><h2>Come for the view.<br/><em>Stay for the feeling.</em></h2><Link className="button button-gold" to="/places">Start exploring ↗</Link></section>
  </main>;
}
function Places() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const url = `/places?search=${encodeURIComponent(params.get('search') || '')}&district=${encodeURIComponent(params.get('district') || '')}&category=${encodeURIComponent(params.get('category') || '')}`;
  const { data, loading, error } = useAsync(() => api(url), [url]);
  const districts = [...new Set((data || []).map(x => x.district))];
  return <main className="listing-page"><PageIntro tag="Find your place" title="A little island, a lot to explore." text="Search ancient cities, misty hill country, wild places and slow beach days."/><div className="filter-row"><input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && setParams({ search })} placeholder="Search by place, district or experience"/><button className="button button-green" onClick={() => setParams(search ? { search } : {})}>Search</button><select aria-label="Filter by district" onChange={e => setParams(e.target.value ? { ...Object.fromEntries(params), district: e.target.value } : { search })}><option value="">All districts</option>{districts.map(d => <option key={d}>{d}</option>)}</select></div>{error ? <ErrorState message={error} /> : loading ? <Loading /> : <div className="card-grid">{data?.map(p => <ImageCard key={p.product_id} item={p} />)}</div>}</main>;
}
function StarRating({ value, max = 5 }) {
  return (
    <span className="star-rating" aria-label={`${value} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < value ? 'star star-filled' : 'star star-empty'}>★</span>
      ))}
    </span>
  );
}

function PlaceGallery({ name, fallbackSrc }) {
  const images = galleryFor(name);
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  // If no gallery images, show single hero
  if (!images.length) {
    return (
      <div className="place-gallery place-gallery--single">
        <img className="place-gallery__hero" src={fallbackSrc} alt={name}
          onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = DESTINATION_PLACEHOLDER; }} />
      </div>
    );
  }

  const prev = () => setActiveIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setActiveIdx(i => (i + 1) % images.length);

  function handleKeyDown(e) {
    if (e.key === 'ArrowLeft') prev();
    else if (e.key === 'ArrowRight') next();
    else if (e.key === 'Escape') setLightbox(false);
  }

  return (
    <div className="place-gallery" onKeyDown={handleKeyDown}>
      {/* Main image */}
      <div className="place-gallery__main" onClick={() => setLightbox(true)} title="Click to view fullscreen">
        <img
          className="place-gallery__hero"
          key={images[activeIdx]}
          src={images[activeIdx]}
          alt={`${name} — photo ${activeIdx + 1}`}
          onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = DESTINATION_PLACEHOLDER; }}
        />
        <button className="pgal-nav pgal-prev" onClick={e => { e.stopPropagation(); prev(); }} aria-label="Previous photo">‹</button>
        <button className="pgal-nav pgal-next" onClick={e => { e.stopPropagation(); next(); }} aria-label="Next photo">›</button>
        <span className="pgal-counter">{activeIdx + 1} / {images.length}</span>
        <span className="pgal-expand-hint">⤢ Fullscreen</span>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="place-gallery__thumbs">
          {images.map((src, i) => (
            <button
              key={src}
              className={`pgal-thumb${i === activeIdx ? ' pgal-thumb--active' : ''}`}
              onClick={() => setActiveIdx(i)}
              aria-label={`View photo ${i + 1}`}
            >
              <img src={src} alt={`${name} thumbnail ${i + 1}`}
                onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = DESTINATION_PLACEHOLDER; }} />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen lightbox */}
      {lightbox && (
        <div className="pgal-lightbox" role="dialog" aria-modal="true" tabIndex={-1}
          ref={el => el && el.focus()}
          onKeyDown={handleKeyDown}
          onClick={e => { if (e.target === e.currentTarget) setLightbox(false); }}
        >
          <button className="pgal-lb-close" onClick={() => setLightbox(false)} aria-label="Close">✕</button>
          <button className="pgal-lb-nav pgal-lb-prev" onClick={prev} aria-label="Previous">‹</button>
          <img
            className="pgal-lb-img"
            src={images[activeIdx]}
            alt={`${name} — photo ${activeIdx + 1}`}
            onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = DESTINATION_PLACEHOLDER; }}
          />
          <button className="pgal-lb-nav pgal-lb-next" onClick={next} aria-label="Next">›</button>
          <div className="pgal-lb-footer">
            <span>{name}</span>
            <span>{activeIdx + 1} / {images.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function PlaceDetail() {
  const { id } = useParams();
  const { data, loading, error } = useAsync(() => api(`/places/${id}`), [id]);
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function save() {
    try {
      await api('/me/favorites', { method: 'POST', body: { product_id: id } });
      toast('Destination saved to your list.');
    } catch (e) { toast(e.message); }
  }

  async function submitReview(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await api(`/places/${id}/reviews`, { method: 'POST', body: { rating, comment } });
      setComment('');
      toast('Review submitted — it will appear after moderation.');
    } catch (e) {
      toast(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  const facilities = (data.facilities || '').split(',').map(f => f.trim()).filter(Boolean);
  const avgRating = data.reviews?.length
    ? (data.reviews.reduce((sum, r) => sum + r.rating, 0) / data.reviews.length).toFixed(1)
    : null;

  return (
    <main className="detail-page place-detail-page">
      {/* Photo Gallery */}
      <PlaceGallery name={data.product_name} fallbackSrc={photoFor(data)} />

      <div className="detail-content place-detail-content">
        {/* Breadcrumb */}
        <nav className="pd-breadcrumb">
          <Link to="/places">Places</Link>
          <span>›</span>
          <span>{data.district}</span>
          <span>›</span>
          <span>{data.product_name}</span>
        </nav>

        {/* Title row */}
        <p className="eyebrow eyebrow-dark">{data.category} · {data.district}</p>
        <div className="detail-title-row">
          <h1>{data.product_name}</h1>
          <button className="button button-outline" onClick={save} id={`save-place-${id}`}>♡ Save place</button>
        </div>

        {/* Rating summary */}
        {avgRating && (
          <div className="pd-rating-summary">
            <StarRating value={Math.round(Number(avgRating))} />
            <span className="pd-rating-score">{avgRating}</span>
            <span className="pd-rating-count">({data.reviews.length} {data.reviews.length === 1 ? 'review' : 'reviews'})</span>
          </div>
        )}

        {/* Description */}
        <p className="lead">{data.short_description}</p>
        <p className="pd-description">{data.description}</p>

        {/* Facilities */}
        {facilities.length > 0 && (
          <section className="pd-facilities">
            <h2>What to expect</h2>
            <div className="pd-chips">
              {facilities.map(f => (
                <span key={f} className="pd-chip">✓ {f}</span>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <section className="review-area">
          <h2>Visitor notes {data.reviews?.length > 0 && <span className="pd-review-count">({data.reviews.length})</span>}</h2>

          {data.reviews?.length === 0 && (
            <p className="pd-no-reviews">No reviews yet — be the first to share your experience!</p>
          )}

          {data.reviews?.map(r => (
            <blockquote key={r.feedback_id} className="pd-review">
              <div className="pd-review-header">
                <div className="pd-reviewer-avatar">{r.fullname?.charAt(0).toUpperCase()}</div>
                <div>
                  <b className="pd-reviewer-name">{r.fullname}</b>
                  <div className="pd-review-meta">
                    <StarRating value={r.rating} />
                    <small>{new Date(r.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}</small>
                  </div>
                </div>
              </div>
              {r.comment && <p className="pd-review-text">{r.comment}</p>}
            </blockquote>
          ))}

          {user ? (
            <form onSubmit={submitReview} className="pd-review-form">
              <h3>Leave a review</h3>
              <label className="pd-review-label">Your rating
                <div className="pd-star-picker">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      type="button"
                      className={`pd-star-btn${n <= (hoverRating || rating) ? ' pd-star-btn--on' : ''}`}
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                    >★</button>
                  ))}
                  <span className="pd-star-label">{hoverRating || rating} star{(hoverRating || rating) !== 1 ? 's' : ''}</span>
                </div>
              </label>
              <label className="pd-review-label">Your thoughts (optional)
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Share a travel tip, what you loved, or what to watch out for…"
                  rows={4}
                />
              </label>
              <button className="button button-green" type="submit" disabled={submitting} id={`submit-review-${id}`}>
                {submitting ? 'Submitting…' : 'Submit review'}
              </button>
            </form>
          ) : (
            <p className="pd-sign-in-prompt"><Link to="/login">Sign in</Link> to save this place or leave a review.</p>
          )}
        </section>
      </div>
    </main>
  );
}
function Hotels() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [district, setDistrict] = useState('');
  const [type, setType] = useState('');
  const { data: meta } = useAsync(() => api('/hotels/meta'), []);
  const url = `/hotels?search=${encodeURIComponent(query)}&district=${encodeURIComponent(district)}&type=${encodeURIComponent(type)}`;
  const { data, loading, error } = useAsync(() => api(url), [url]);

  const manualHotels   = (data || []).filter(h => h.dataset_source !== 'sltda_import');
  const datasetEntries = (data || []).filter(h => h.dataset_source === 'sltda_import');

  return (
    <main className="listing-page">
      <PageIntro
        tag="Rest well, wander far"
        title="Find your island stay."
        text="Browse hotels, guest houses, villas, bungalows and homestays from official SLTDA records across Sri Lanka."
      />

      {/* Filters */}
      <div className="stays-filter-bar">
        <form className="stays-search-form" onSubmit={e => { e.preventDefault(); setQuery(search); }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, town or district…"
            aria-label="Search stays"
          />
          <button className="button button-green" type="submit">Search</button>
        </form>
        <div className="stays-dropdowns">
          <select
            value={district}
            onChange={e => setDistrict(e.target.value)}
            aria-label="Filter by district"
          >
            <option value="">All districts</option>
            {meta?.districts?.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            aria-label="Filter by accommodation type"
          >
            <option value="">All types</option>
            {meta?.types?.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Results count */}
      {!loading && !error && data && (
        <p className="stays-count">
          {data.length} {data.length === 1 ? 'stay' : 'stays'} found
          {district ? ` in ${district}` : ''}
          {type ? ` · ${type}` : ''}
        </p>
      )}

      {error ? <ErrorState message={error} /> : loading ? <Loading /> : (
        <>
          {/* Manually-curated hotels (with rooms & booking) */}
          {manualHotels.length > 0 && (
            <>
              <h2 className="stays-section-heading">Featured Stays</h2>
              <div className="card-grid stays-featured">
                {manualHotels.map(h => <ImageCard item={h} type="hotel" key={h.hotel_id} />)}
              </div>
            </>
          )}

          {/* Dataset-imported accommodations */}
          {datasetEntries.length > 0 && (
            <>
              <h2 className="stays-section-heading">
                {manualHotels.length > 0 ? 'All Registered Accommodations' : 'Registered Accommodations'}
                <span className="stays-section-badge">SLTDA Registry</span>
              </h2>
              <div className="dataset-stays-grid">
                {datasetEntries.map(h => <DatasetStayCard key={h.hotel_id} item={h} />)}
              </div>
            </>
          )}

          {data.length === 0 && (
            <div className="page-state">
              <p>No stays match your filters.</p>
              <button className="button button-outline" onClick={() => { setQuery(''); setDistrict(''); setType(''); setSearch(''); }}>
                Clear filters
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

function licenceTag(licenceStatus) {
  if (!licenceStatus) return null;
  const s = licenceStatus.toLowerCase();
  if (s.includes('valid')) return { label: 'Licensed', cls: 'tag-valid' };
  if (s.includes('expired')) return { label: 'Licence expired', cls: 'tag-expired' };
  return { label: licenceStatus.slice(0, 30), cls: 'tag-unknown' };
}

function recordTag(recordStatus) {
  if (!recordStatus) return null;
  const map = {
    'official':    { label: 'Official listing', cls: 'tag-official' },
    'historical':  { label: 'Historical record', cls: 'tag-historical' },
    'travel-site': { label: 'Travel-site listing', cls: 'tag-travel' },
    'unverified':  { label: 'Unverified', cls: 'tag-unverified' },
  };
  return map[recordStatus] || { label: recordStatus, cls: 'tag-unverified' };
}

function DatasetStayCard({ item }) {
  const lt = licenceTag(item.licence_status);
  const rt = recordTag(item.record_status);
  const hasContact = item.phone || item.mobile || item.email;
  const hasLink    = item.website || item.booking_link;
  return (
    <article className="dataset-stay-card">
      {/* Header */}
      <div className="dsc-header">
        <div className="dsc-title-row">
          <h3 className="dsc-name">{item.hotel_name}</h3>
          {item.star_category > 0 && (
            <span className="dsc-stars" title={`${item.star_category} stars`}>
              {'★'.repeat(item.star_category)}
            </span>
          )}
        </div>
        <div className="dsc-meta">
          {item.accommodation_type && <span className="dsc-type">{item.accommodation_type}</span>}
          {item.district && <span className="dsc-district">{item.district}</span>}
          {item.grade && <span className="dsc-grade">Grade {item.grade}</span>}
        </div>
      </div>

      {/* Status badges */}
      <div className="dsc-badges">
        {lt && <span className={`dsc-badge ${lt.cls}`}>{lt.label}</span>}
        {rt && <span className={`dsc-badge ${rt.cls}`}>{rt.label}</span>}
        {(!lt || lt.cls !== 'tag-valid') && (
          <span className="dsc-badge tag-warning" title="Verify with the property before booking">
            ⚠ Verify before booking
          </span>
        )}
      </div>

      {/* Contact details */}
      {hasContact && (
        <div className="dsc-contact">
          {item.phone  && <a href={`tel:${item.phone}`}  className="dsc-contact-item">📞 {item.phone}</a>}
          {item.mobile && !item.phone && <a href={`tel:${item.mobile}`} className="dsc-contact-item">📱 {item.mobile}</a>}
          {item.email  && <a href={`mailto:${item.email}`} className="dsc-contact-item">✉ {item.email}</a>}
        </div>
      )}

      {/* Address */}
      {item.address && item.address !== item.district && (
        <p className="dsc-address">{item.address.slice(0, 120)}</p>
      )}

      {/* Links */}
      {hasLink && (
        <div className="dsc-links">
          {item.website && (
            <a href={item.website} target="_blank" rel="noopener noreferrer" className="dsc-link">
              🌐 Website
            </a>
          )}
          {item.booking_link && (
            <a href={item.booking_link} target="_blank" rel="noopener noreferrer" className="dsc-link dsc-link-book">
              🏷 Book online
            </a>
          )}
        </div>
      )}

      {/* Registration */}
      {item.registration_number && (
        <p className="dsc-reg">Reg: {item.registration_number}</p>
      )}
    </article>
  );
}
function HotelDetail() {
  const { id } = useParams(); const { data, loading, error } = useAsync(() => api(`/hotels/${id}`), [id]); const { user } = useContext(AuthContext); const toast = useToast(); const nav = useNavigate(); const [form, setForm] = useState({ checkin_date: '', checkout_date: '', guests: 2, rooms_booked: 1 });
  if (loading) return <Loading />; if (error) return <ErrorState message={error} />;
  async function book(room) { if (!user) { nav('/login'); return; } try { const result = await api('/bookings', { method: 'POST', body: { ...form, hotel_id: data.hotel_id, room_id: room.room_id } }); toast(`Booking request sent: ${result.booking_ref}`); nav('/bookings'); } catch (e) { toast(e.message); } }
  return <main className="detail-page"><img className="detail-hero" src={photoFor(data)} alt={data.hotel_name} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = HOTEL_PLACEHOLDER; }}/><div className="detail-content"><p className="eyebrow eyebrow-dark">{data.city}, {data.district} · {data.star_category} star stay</p><h1>{data.hotel_name}</h1><p className="lead">{data.short_desc}</p><p>{data.description}</p><p>{data.facilities}</p><h2>Choose your room</h2><div className="room-list">{data.rooms?.map(room => <article key={room.room_id}><div><h3>{room.room_name}</h3><p>{room.description || `${room.capacity} guests · ${room.beds} bed(s)`}</p></div><strong>LKR {Number(room.price_per_night).toLocaleString()}<small> / night</small></strong><label>Check in<input type="date" value={form.checkin_date} onChange={e => setForm({...form, checkin_date:e.target.value})}/></label><label>Check out<input type="date" value={form.checkout_date} onChange={e => setForm({...form, checkout_date:e.target.value})}/></label><label>Guests<input type="number" min="1" value={form.guests} onChange={e => setForm({...form, guests:e.target.value})}/></label><button className="button button-green" onClick={() => book(room)}>Request booking</button></article>)}</div></div></main>;
}
function Features() { const { data, loading, error } = useAsync(() => api('/features'), []); return <main className="listing-page"><PageIntro tag="Choose your pace" title="Experiences for every kind of traveller." text="Meet Sri Lanka through its living heritage, big landscapes, local flavours and open coastline."/>{error ? <ErrorState message={error}/> : loading ? <Loading/> : <div className="feature-cards">{data?.map((f,i) => <article key={f.features_id}><span>0{i+1}</span><h2>{f.features_name}</h2><p>{f.description}</p><small>{f.facilities}</small></article>)}</div>}</main>; }

function Lightbox({ photos, activeIndex, onClose, onSelectIndex }) {
  const currentPhoto = photos[activeIndex];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onSelectIndex((activeIndex - 1 + photos.length) % photos.length);
      if (e.key === 'ArrowRight') onSelectIndex((activeIndex + 1) % photos.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = origOverflow;
    };
  }, [activeIndex, photos.length, onClose, onSelectIndex]);

  if (!currentPhoto) return null;

  return (
    <div className="lightbox-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Photo Lightbox">
      <div className="lightbox-dialog" onClick={e => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose} aria-label="Close Lightbox">✕</button>
        
        <div className="lightbox-stage">
          <button 
            className="lightbox-nav lightbox-prev" 
            onClick={() => onSelectIndex((activeIndex - 1 + photos.length) % photos.length)}
            aria-label="Previous photograph"
          >
            ‹
          </button>
          
          <div className="lightbox-media">
            <img 
              src={currentPhoto.url} 
              alt={`${currentPhoto.title} - ${currentPhoto.destination}`} 
              className="lightbox-image"
            />
          </div>

          <button 
            className="lightbox-nav lightbox-next" 
            onClick={() => onSelectIndex((activeIndex + 1) % photos.length)}
            aria-label="Next photograph"
          >
            ›
          </button>
        </div>

        <div className="lightbox-footer">
          <div className="lightbox-meta">
            <span className="lightbox-category">{currentPhoto.category}</span>
            <h2>{currentPhoto.destination}</h2>
            <p className="lightbox-title">{currentPhoto.title}</p>
          </div>
          <div className="lightbox-controls">
            <span className="lightbox-counter">{activeIndex + 1} of {photos.length}</span>
            {currentPhoto.productId && (
              <Link to={`/places/${currentPhoto.productId}`} className="button button-gold lightbox-link" onClick={onClose}>
                Explore destination <span>↗</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Gallery() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const selectedCategory = params.get('category') || 'All';
  const selectedDestination = params.get('destination') || 'All';
  const [viewMode, setViewMode] = useState('destinations');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const { data, loading, error } = useAsync(() => api('/gallery'), []);

  const filteredDestinations = useMemo(() => {
    if (!data?.destinations) return [];
    return data.destinations
      .map(dest => {
        if (selectedCategory !== 'All' && dest.category !== selectedCategory) return null;
        if (selectedDestination !== 'All' && dest.name !== selectedDestination) return null;
        
        const q = search.trim().toLowerCase();
        const matchingPhotos = dest.photos.filter(p => {
          if (!q) return true;
          return p.destination.toLowerCase().includes(q) ||
                 p.title.toLowerCase().includes(q) ||
                 p.category.toLowerCase().includes(q);
        });

        if (matchingPhotos.length === 0) return null;
        return {
          ...dest,
          photos: matchingPhotos
        };
      })
      .filter(Boolean);
  }, [data, search, selectedCategory, selectedDestination]);

  const allVisiblePhotos = useMemo(() => {
    return filteredDestinations.flatMap(d => d.photos);
  }, [filteredDestinations]);

  const updateParam = (key, val) => {
    const next = Object.fromEntries(params);
    if (!val || val === 'All') delete next[key];
    else next[key] = val;
    setParams(next);
  };

  const clearAllFilters = () => {
    setParams({});
  };

  const openLightbox = (photo) => {
    const index = allVisiblePhotos.findIndex(p => p.id === photo.id);
    if (index !== -1) setLightboxIndex(index);
  };

  if (loading) return <main className="listing-page"><PageIntro tag="Visual Island Guide" title="Sri Lanka in focus." text="Loading photographs…"/><Loading /></main>;
  if (error) return <main className="listing-page"><PageIntro tag="Visual Island Guide" title="Sri Lanka in focus."/><ErrorState message={error} /></main>;

  const totalDestinationsCount = data?.destinations?.length || 0;
  const totalPhotosCount = data?.totalPhotos || 0;
  const categoriesList = data?.categories || ['All'];
  const destinationNames = (data?.destinations || []).map(d => d.name);

  return (
    <main className="listing-page gallery-page">
      <PageIntro 
        tag="Visual Island Guide" 
        title="Sri Lanka in focus." 
        text={`A curated collection of ${totalPhotosCount} photographs across ${totalDestinationsCount} destinations — from misty highland trails and sacred rock citadels to untamed wildlife and quiet coastal bays.`}
      />

      <div className="gallery-toolbar">
        <div className="gallery-search-box">
          <input 
            type="text" 
            placeholder="Search by destination, photo name or category…" 
            value={search} 
            onChange={e => updateParam('search', e.target.value)}
            aria-label="Search gallery"
          />
          {search && (
            <button className="clear-search-btn" onClick={() => updateParam('search', '')} aria-label="Clear search">✕</button>
          )}
        </div>

        <div className="gallery-dropdowns">
          <select 
            value={selectedDestination} 
            onChange={e => updateParam('destination', e.target.value)}
            aria-label="Filter by destination"
          >
            <option value="All">All destinations ({totalDestinationsCount})</option>
            {destinationNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          <div className="gallery-view-toggle">
            <button 
              className={viewMode === 'destinations' ? 'active' : ''} 
              onClick={() => setViewMode('destinations')}
              type="button"
            >
              Grouped
            </button>
            <button 
              className={viewMode === 'all' ? 'active' : ''} 
              onClick={() => setViewMode('all')}
              type="button"
            >
              All photos
            </button>
          </div>
        </div>
      </div>

      <div className="category-pills">
        {categoriesList.map(cat => (
          <button 
            key={cat} 
            className={`pill-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => updateParam('category', cat)}
            type="button"
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="gallery-status-row">
        <span>Showing <b>{allVisiblePhotos.length}</b> photograph{allVisiblePhotos.length !== 1 ? 's' : ''} across <b>{filteredDestinations.length}</b> destination{filteredDestinations.length !== 1 ? 's' : ''}</span>
        {(search || selectedCategory !== 'All' || selectedDestination !== 'All') && (
          <button className="reset-filters-link" onClick={clearAllFilters} type="button">Reset filters ↺</button>
        )}
      </div>

      {allVisiblePhotos.length === 0 ? (
        <div className="gallery-empty-state">
          <div className="empty-icon">📷</div>
          <h2>No photographs match your criteria</h2>
          <p>Try searching for another destination or experience, or reset your filters to see the full collection.</p>
          <button className="button button-green" onClick={clearAllFilters} type="button">View all photographs →</button>
        </div>
      ) : viewMode === 'destinations' ? (
        <div className="gallery-destinations-wrap">
          {filteredDestinations.map(dest => (
            <section key={dest.id} className="destination-gallery-group">
              <div className="destination-group-header">
                <div>
                  <span className="eyebrow eyebrow-dark">{dest.category}</span>
                  <h2>{dest.name}</h2>
                </div>
                <div className="group-header-actions">
                  <span className="photo-count-badge">{dest.photos.length} photo{dest.photos.length !== 1 ? 's' : ''}</span>
                  {dest.productId && (
                    <Link to={`/places/${dest.productId}`} className="text-link">Destination details ↗</Link>
                  )}
                </div>
              </div>

              <div className="gallery-grid">
                {dest.photos.map(photo => (
                  <div 
                    key={photo.id} 
                    className="gallery-item"
                    onClick={() => openLightbox(photo)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(photo); } }}
                    aria-label={`View photo: ${photo.title}`}
                  >
                    <div className="gallery-thumb">
                      <img 
                        src={photo.url} 
                        alt={`${photo.title} - ${photo.destination}`} 
                        loading="lazy"
                        onError={e => { e.currentTarget.onerror=null; e.currentTarget.src="/assets/images/placeholders/placeholder.svg"; }}
                      />
                      <div className="gallery-overlay">
                        <span className="zoom-icon">↗</span>
                        <p className="photo-title">{photo.title}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="gallery-grid all-photos-grid">
          {allVisiblePhotos.map(photo => (
            <div 
              key={photo.id} 
              className="gallery-item"
              onClick={() => openLightbox(photo)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(photo); } }}
              aria-label={`View photo: ${photo.title}`}
            >
              <div className="gallery-thumb">
                <img 
                  src={photo.url} 
                  alt={`${photo.title} - ${photo.destination}`} 
                  loading="lazy"
                  onError={e => { e.currentTarget.onerror=null; e.currentTarget.src="/assets/images/placeholders/placeholder.svg"; }}
                />
                <div className="gallery-overlay">
                  <span className="destination-tag">{photo.destination}</span>
                  <span className="zoom-icon">↗</span>
                  <p className="photo-title">{photo.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox 
          photos={allVisiblePhotos}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onSelectIndex={setLightboxIndex}
        />
      )}
    </main>
  );
}

function About() { return <main className="editorial-page"><PageIntro tag="Ayubowan · Welcome" title="A small island with a world within." text="Explore Lanka is a guide to the places, stories and stays that make a visit to Sri Lanka feel personal."/><div className="about-grid"><img src="/assets/images/banners/sri-lanka-hero.jpg" alt="A quiet tropical river framed by palms"/><div><p className="eyebrow eyebrow-dark">Made for curious journeys</p><h2>Go beyond the checklist.</h2><p>Follow a winding road through tea country. Spend an extra hour at a quiet beach. Learn the story behind an old stone wall. Our guide brings destinations and practical details together so you can plan a trip around what you love.</p><Link className="button button-green" to="/places">Browse destinations →</Link></div></div></main>; }
function Contact() { const [form, setForm] = useState({ fullname:'', email:'', subject:'', message:'' }); const [sent,setSent]=useState(''); const [error,setError]=useState(''); async function submit(e){e.preventDefault();setError('');try{const r=await api('/contact',{method:'POST',body:form});setSent(r.message);setForm({fullname:'',email:'',subject:'',message:''});}catch(err){setError(err.message);}} return <main className="contact-page"><PageIntro tag="We’re listening" title="Tell us what you’re planning." text="Ask a question, share an idea or send us a note about your journey."/><form className="simple-form contact-form" onSubmit={submit}>{sent&&<p className="success-text">{sent}</p>}{error&&<p className="form-error">{error}</p>}<label>Your name<input required value={form.fullname} onChange={e=>setForm({...form,fullname:e.target.value})}/></label><label>Email address<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Subject<input required value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}/></label><label>Your message<textarea required rows="5" value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/></label><button className="button button-green">Send message →</button></form></main>; }
function AuthForm({ mode, authReady }) {
  const isLogin=mode==='login'; const [form,setForm]=useState({fullname:'',email:'',password:'',phone:''}); const [error,setError]=useState(''); const {user,setUser}=useContext(AuthContext); const nav=useNavigate(); const location=useLocation();
  if(!authReady) return <Loading/>; if(user) return <Navigate to={location.state?.from || '/dashboard'} replace/>;
  async function submit(e){e.preventDefault();setError('');try{const result=await api(`/auth/${mode}`,{method:'POST',body:form});setUser(result.user);nav(location.state?.from || (result.user.role==='admin'?'/admin':'/dashboard'));}catch(err){setError(err.message);}}
  return <main className="auth-page"><div className="auth-photo"><img src="/assets/images/banners/tropical_auth_banner.jpg" alt="Tropical Sri Lankan coastline"/><div><p className="eyebrow">The journey is yours</p><h2>Make room for wonder.</h2></div></div><form className="simple-form auth-form" onSubmit={submit}><p className="eyebrow eyebrow-dark">Explore Lanka account</p><h1>{isLogin?'Welcome back.':'Let’s get started.'}</h1><p>{isLogin?'Sign in to save places and manage your plans.':'Create an account to save destinations and plan your stay.'}</p>{error&&<p className="form-error">{error}</p>}{!isLogin&&<label>Full name<input required minLength="2" value={form.fullname} onChange={e=>setForm({...form,fullname:e.target.value})}/></label>}<label>Email address<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>{!isLogin&&<label>Phone (optional)<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>}<label>Password<input type="password" minLength={isLogin?1:8} required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label><button className="button button-green">{isLogin?'Sign in':'Create account'} →</button><p className="auth-switch">{isLogin?<>New to Explore Lanka? <Link to="/register">Create an account</Link></>:<>Already registered? <Link to="/login">Sign in</Link></>}</p></form></main>;
}
function Dashboard() { const { data,loading,error }=useAsync(()=>api('/me/dashboard'),[]); const {user}=useContext(AuthContext); return <main className="account-page"><PageIntro tag={`Good to see you, ${user.fullname.split(' ')[0]}`} title="Your journey, in one place." text="Keep your saved destinations and accommodation plans close at hand."/>{error?<ErrorState message={error}/>:loading?<Loading/>:<><div className="metric-grid"><article><b>{data.saved}</b><span>Saved places</span></article><article><b>{data.bookings}</b><span>Upcoming bookings</span></article><article><b>01</b><span>Island to explore</span></article></div><div className="account-links"><Link to="/favorites">View saved places →</Link><Link to="/bookings">Manage bookings →</Link><Link to="/profile">Edit profile →</Link></div></>}</main>; }
function Favorites() { const {data,loading,error}=useAsync(()=>api('/me/favorites'),[]); const toast=useToast(); async function remove(id){try{await api(`/me/favorites/${id}`,{method:'DELETE'});toast('Removed from saved places.');window.location.reload();}catch(e){toast(e.message);}} return <main className="account-page"><PageIntro tag="Your shortlist" title="Places you’ve saved." text="A little inspiration for the trip ahead."/>{error?<ErrorState message={error}/>:loading?<Loading/>:<div className="saved-list">{data?.map(x=><article key={x.add_id}><div><h3>{x.features_name}</h3><p>{x.district||'Sri Lanka'} · Saved for later</p></div>{x.product_id&&<Link className="text-link" to={`/places/${x.product_id}`}>View place ↗</Link>}<button className="button button-outline" onClick={()=>remove(x.add_id)}>Remove</button></article>)}{!data?.length&&<p>No saved places yet. <Link to="/places">Explore destinations.</Link></p>}</div>}</main>; }
function Bookings() { const {data,loading,error}=useAsync(()=>api('/me/bookings'),[]); const toast=useToast(); async function cancel(id){try{await api(`/me/bookings/${id}/cancel`,{method:'PATCH',body:{}});toast('Booking cancelled.');window.location.reload();}catch(e){toast(e.message);}} return <main className="account-page"><PageIntro tag="Your stays" title="Booking requests." text="Review the status and details of your hotel bookings."/>{error?<ErrorState message={error}/>:loading?<Loading/>:<div className="saved-list">{data?.map(b=><article key={b.booking_id}><div><h3>{b.hotel_name}</h3><p>{b.room_name} · {b.checkin_date} to {b.checkout_date} · {b.booking_ref}</p></div><b className={`status status-${b.status}`}>{b.status}</b>{['pending','confirmed'].includes(b.status)&&<button className="button button-outline" onClick={()=>cancel(b.booking_id)}>Cancel</button>}</article>)}{!data?.length&&<p>No bookings yet. <Link to="/hotels">Find a place to stay.</Link></p>}</div>}</main>; }
function timeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function UserAvatar({ src, name = '', className = 'post-avatar', size }) {
  const [imgError, setImgError] = useState(false);
  const initials = name ? name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';
  
  let url = null;
  if (src && !imgError) {
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/Tourist_Images/') || src.startsWith('/uploads/')) {
      url = src;
    } else {
      url = `/uploads/profiles/${src}`;
    }
  }

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={className}
        style={size ? { width: size, height: size } : undefined}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={className} style={size ? { width: size, height: size } : undefined}>
      {initials}
    </div>
  );
}

const POPULAR_DESTINATIONS = [
  'Sigiriya', 'Ella', 'Galle Fort', 'Mirissa Beach', 'Kandy',
  'Nuwara Eliya', 'Yala National Park', 'Nine Arch Bridge', 'Trincomalee',
  'Jaffna', 'Dambulla', 'Arugam Bay', 'Adams Peak', 'Polonnaruwa'
];

function ReportModal({ isOpen, onClose, targetType, targetId }) {
  const [reason, setReason] = useState('Spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api('/community/reports', {
        method: 'POST',
        body: { target_type: targetType, target_id: targetId, reason, details }
      });
      toast('Report submitted. Thank you for keeping Explore Lanka safe!');
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminModal
      title={`Report ${targetType === 'post' ? 'Travel Post' : 'Community Member'}`}
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="admin-form-group">
          <label>Reason for report</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="Spam">Spam or commercial advertisement</option>
            <option value="Harassment">Harassment, hate speech, or abuse</option>
            <option value="Inappropriate">Inappropriate or offensive photo/video</option>
            <option value="Misleading">Misleading travel information or dangerous spot</option>
            <option value="Fake Account">Fake profile or impersonation</option>
            <option value="Other">Other issue</option>
          </select>
        </div>
        <div className="admin-form-group">
          <label>Additional Details (optional)</label>
          <textarea
            rows={3}
            placeholder="Help our moderation team understand what went wrong..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="admin-btn admin-btn-danger" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}

function PostMediaLightbox({ photos, activeIndex, onClose, onSelectIndex }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && activeIndex > 0) onSelectIndex(activeIndex - 1);
      if (e.key === 'ArrowRight' && activeIndex < photos.length - 1) onSelectIndex(activeIndex + 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, photos.length, onClose, onSelectIndex]);

  const current = photos[activeIndex];
  if (!current) return null;
  const mediaUrl = current.media_url || current.url || current;

  return (
    <div className="lightbox-overlay" onClick={onClose} role="dialog" aria-modal="true" style={{ background: 'rgba(0, 0, 0, 0.92)' }}>
      <div className="lightbox-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '92vh', background: 'transparent' }}>
        <div className="lightbox-header" style={{ borderBottom: 'none' }}>
          <div className="lightbox-info">
            <span className="lightbox-counter">Photo {activeIndex + 1} of {photos.length}</span>
          </div>
          <button type="button" className="lightbox-close" onClick={onClose} aria-label="Close lightbox">✕</button>
        </div>

        <div className="lightbox-stage" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          {activeIndex > 0 && (
            <button
              type="button"
              className="lightbox-nav lightbox-prev"
              onClick={() => onSelectIndex(activeIndex - 1)}
              aria-label="Previous photo"
            >
              ‹
            </button>
          )}

          <img
            src={mediaUrl}
            alt={`Post photo ${activeIndex + 1}`}
            className="lightbox-image"
            style={{ objectFit: 'contain', maxWidth: '88vw', maxHeight: '78vh', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/images/placeholders/placeholder.svg'; }}
          />

          {activeIndex < photos.length - 1 && (
            <button
              type="button"
              className="lightbox-nav lightbox-next"
              onClick={() => onSelectIndex(activeIndex + 1)}
              aria-label="Next photo"
            >
              ›
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CreatePostCard({ user, onPostCreated, onTagSelect }) {
  const [content, setContent] = useState('');
  const [destTag, setDestTag] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [mediaType, setMediaType] = useState('none'); // 'none' | 'photos' | 'video'
  const [attachments, setAttachments] = useState([]); // [{ url, type: 'photo'|'video' }]
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showMediaTool, setShowMediaTool] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (mediaType === 'video' || files.some(f => f.type.startsWith('video/'))) {
      if (files.length > 1) {
        setError('Video posts support 1 video at a time.');
        return;
      }
      const file = files[0];
      if (file.size > 50 * 1024 * 1024) {
        setError('Video file size cannot exceed 50 MB.');
        return;
      }
      setUploading(true);
      setError('');
      try {
        const reader = new FileReader();
        const base64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const result = await api('/uploads/posts', { method: 'POST', body: { image: base64 } });
        setMediaType('video');
        setAttachments([{ url: `/uploads/posts/${result.filename}`, type: 'video' }]);
      } catch (err) {
        setError(err.message || 'Failed to upload video file.');
      } finally {
        setUploading(false);
      }
      return;
    }

    // Photo uploads (up to 10 photos)
    const availableSlots = 10 - attachments.length;
    if (availableSlots <= 0) {
      setError('Maximum 10 photos allowed per post.');
      return;
    }

    const filesToUpload = files.slice(0, availableSlots);
    setUploading(true);
    setError('');

    try {
      const uploadedList = [];
      for (const file of filesToUpload) {
        if (file.size > 10 * 1024 * 1024) continue;
        const reader = new FileReader();
        const base64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const res = await api('/uploads/posts', { method: 'POST', body: { image: base64 } });
        uploadedList.push({ url: `/uploads/posts/${res.filename}`, type: 'photo' });
      }

      setMediaType('photos');
      setAttachments(prev => [...prev, ...uploadedList]);
    } catch (err) {
      setError(err.message || 'Failed to upload photos.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddUrl = () => {
    const url = videoUrlInput.trim();
    if (!url) return;
    const isVid = /\.(mp4|webm|ogg)$/i.test(url) || url.includes('video');
    if (isVid) {
      setMediaType('video');
      setAttachments([{ url, type: 'video' }]);
    } else {
      setMediaType('photos');
      setAttachments(prev => prev.length < 10 ? [...prev, { url, type: 'photo' }] : prev);
    }
    setVideoUrlInput('');
  };

  const handleRemoveAttachment = (index) => {
    const updated = attachments.filter((_, i) => i !== index);
    setAttachments(updated);
    if (updated.length === 0) {
      setMediaType('none');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const text = content.trim();
    if (!text) {
      setError('Please write something to share with the community.');
      return;
    }

    const tagToUse = destTag === 'CUSTOM' ? customTag.trim() : (destTag || null);

    setSubmitting(true);
    try {
      const payload = {
        content: text,
        destination_tag: tagToUse,
        media_type: mediaType,
        media: attachments.map((att, idx) => ({
          media_url: att.url,
          media_type: att.type,
          sort_order: idx
        })),
        image_url: attachments.length > 0 ? attachments[0].url : null
      };

      const newPost = await api('/community/posts', {
        method: 'POST',
        body: payload
      });

      setContent('');
      setDestTag('');
      setCustomTag('');
      setAttachments([]);
      setMediaType('none');
      setShowMediaTool(false);
      onPostCreated(newPost);
    } catch (err) {
      setError(err.message || 'Failed to publish post.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="post-creator-card">
      <div className="creator-top-row">
        <UserAvatar src={user?.profile_image} name={user?.fullname} className="creator-avatar" />
        <div className="creator-prompt-text">
          <span>What did you discover in Sri Lanka, {user?.fullname?.split(' ')[0]}?</span>
          <small>Share up to 10 photos or a short video with travelers</small>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {error && <div className="admin-notice-banner admin-notice-error" style={{ margin: 0 }}>{error}</div>}

        <textarea
          className="creator-textarea"
          placeholder="Share your travel story, recommendations, or itinerary moment…"
          rows={3}
          maxLength={3000}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {/* Media Preview Bar */}
        {attachments.length > 0 && (
          <div className="media-preview-bar">
            {attachments.map((item, idx) => (
              <div key={idx} className="media-preview-item">
                {item.type === 'video' ? (
                  <video src={item.url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src={item.url} alt={`Preview ${idx + 1}`} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/images/placeholders/placeholder.svg'; }} />
                )}
                <button
                  type="button"
                  className="media-preview-remove"
                  onClick={() => handleRemoveAttachment(idx)}
                  title="Remove attachment"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Media Attach Uploader Panel */}
        {showMediaTool && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px', background: 'var(--paper)', borderRadius: '12px', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--ink)' }}>
                {mediaType === 'video' ? 'Attach Video' : `Attach Photos (${attachments.length}/10)`}
              </span>
              <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setShowMediaTool(false)}>Close</button>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <label className="admin-btn admin-btn-primary admin-btn-sm" style={{ cursor: 'pointer' }}>
                📁 Select Photos (Up to 10)
                <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>

              <label className="admin-btn admin-btn-lavender admin-btn-sm" style={{ cursor: 'pointer' }}>
                🎬 Select Short Video
                <input type="file" accept="video/mp4,video/webm" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                placeholder="Or paste media URL (e.g. /Tourist_Images/... or video link)"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                style={{ flex: 1, padding: '7px 10px', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink)' }}
              />
              <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={handleAddUrl}>Add URL</button>
            </div>
            {uploading && <small style={{ color: 'var(--lavender)', fontWeight: 600 }}>Uploading attachments…</small>}
          </div>
        )}

        <div className="creator-bottom-toolbar">
          <div className="creator-tools-left">
            <button
              type="button"
              className="creator-tool-btn"
              onClick={() => setShowMediaTool(!showMediaTool)}
            >
              📷 Add Media {attachments.length > 0 && `(${attachments.length})`}
            </button>

            <select
              className="creator-dest-select"
              value={destTag}
              onChange={(e) => setDestTag(e.target.value)}
              aria-label="Destination tag"
            >
              <option value="">📍 Tag Spot (Optional)</option>
              {POPULAR_DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              <option value="CUSTOM">+ Custom Spot…</option>
            </select>

            {destTag === 'CUSTOM' && (
              <input
                type="text"
                placeholder="Type spot name…"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--paper)', color: 'var(--ink)', width: '130px' }}
              />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="creator-char-count">{content.length}/3000</span>
            <button
              type="submit"
              className="button button-green"
              style={{ padding: '8px 18px', minHeight: '38px', fontSize: '0.86rem' }}
              disabled={submitting || uploading || !content.trim()}
            >
              {submitting ? 'Publishing…' : 'Share Moment →'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function PostCommentsSection({ postId, user, commentCount, onCommentCountChange }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api(`/community/posts/${postId}/comments`)
      .then(rows => { if (active) { setComments(rows); setLoading(false); } })
      .catch(err => { if (active) { setError(err.message); setLoading(false); } });
    return () => { active = false; };
  }, [postId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    const text = newComment.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      const created = await api(`/community/posts/${postId}/comments`, {
        method: 'POST',
        body: { content: text }
      });
      setComments(prev => [...prev, created]);
      setNewComment('');
      onCommentCountChange(commentCount + 1);
    } catch (err) {
      alert(err.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (commentId) => {
    const text = editContent.trim();
    if (!text) return;
    try {
      await api(`/community/comments/${commentId}`, {
        method: 'PATCH',
        body: { content: text }
      });
      setComments(prev => prev.map(c => c.comment_id === commentId ? { ...c, content: text } : c));
      setEditingId(null);
    } catch (err) {
      alert(err.message || 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api(`/community/comments/${commentId}`, { method: 'DELETE' });
      setComments(prev => prev.filter(c => c.comment_id !== commentId));
      onCommentCountChange(Math.max(0, commentCount - 1));
    } catch (err) {
      alert(err.message || 'Failed to delete comment');
    }
  };

  return (
    <div className="post-comments-wrap">
      {loading ? (
        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center', padding: '8px 0' }}>Loading comments…</div>
      ) : error ? (
        <div style={{ fontSize: '0.8rem', color: '#dc2626' }}>{error}</div>
      ) : comments.length === 0 ? (
        <div style={{ fontSize: '0.82rem', color: 'var(--muted)', fontStyle: 'italic', padding: '4px 0' }}>
          No comments yet. Be the first to start the conversation!
        </div>
      ) : (
        <div className="comments-list">
          {comments.map(c => (
            <div key={c.comment_id} className="comment-item">
              <Link to={`/community/members/${c.user_id}`}>
                <UserAvatar src={c.author_avatar} name={c.author_name} className="comment-avatar" />
              </Link>
              <div className="comment-bubble">
                <div className="comment-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Link to={`/community/members/${c.user_id}`} className="comment-author-name">
                      {c.author_name}
                    </Link>
                    {c.author_role === 'admin' && <span className="post-role-pill">Guide</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="comment-time">{timeAgo(c.created_at)}</span>
                    {c.can_delete && (
                      <div className="comment-actions">
                        {c.can_edit && editingId !== c.comment_id && (
                          <button
                            type="button"
                            className="comment-action-btn"
                            onClick={() => { setEditingId(c.comment_id); setEditContent(c.content); }}
                            title="Edit comment"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          className="comment-action-btn"
                          onClick={() => handleDeleteComment(c.comment_id)}
                          title="Delete comment"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {editingId === c.comment_id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                    <input
                      type="text"
                      className="comment-input-field"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-primary admin-btn-sm"
                        onClick={() => handleSaveEdit(c.comment_id)}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="comment-text">{c.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New comment input */}
      <form className="comment-input-form" onSubmit={handleAddComment}>
        <UserAvatar src={user?.profile_image} name={user?.fullname} className="comment-avatar" />
        <input
          type="text"
          className="comment-input-field"
          placeholder="Write a comment…"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          maxLength={1000}
        />
        <button
          type="submit"
          className="comment-send-btn"
          disabled={submitting || !newComment.trim()}
        >
          {submitting ? '…' : 'Send'}
        </button>
      </form>
    </div>
  );
}

function PostCard({ post, user, onPostUpdated, onPostDeleted, onSelectTag }) {
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [isFollowing, setIsFollowing] = useState(Boolean(post.is_following));
  const [friendStatus, setFriendStatus] = useState(post.friend_status || 'none');
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [editTag, setEditTag] = useState(post.destination_tag || '');
  const [submitting, setSubmitting] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState({ type: 'post', id: post.post_id });
  const [showMenu, setShowMenu] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  const isOwnPost = user?.user_id === post.user_id;
  const mediaList = (post.media && post.media.length > 0)
    ? post.media
    : (post.image_url ? [{ media_url: post.image_url, media_type: 'photo' }] : []);

  const isVideoPost = post.media_type === 'video' || (mediaList.length === 1 && mediaList[0].media_type === 'video');

  const handleToggleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const nextLiked = !isLiked;
    const nextCount = nextLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    
    setIsLiked(nextLiked);
    setLikeCount(nextCount);

    try {
      const res = await api(`/community/posts/${post.post_id}/like`, {
        method: nextLiked ? 'POST' : 'DELETE'
      });
      setLikeCount(res.like_count);
      setIsLiked(res.liked);
    } catch (err) {
      setIsLiked(!nextLiked);
      setLikeCount(likeCount);
      toast(err.message || 'Failed to update like');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    try {
      await api(`/community/users/${post.user_id}/follow`, {
        method: nextState ? 'POST' : 'DELETE'
      });
      toast(nextState ? `Following ${post.author_name}` : `Unfollowed ${post.author_name}`);
    } catch (err) {
      setIsFollowing(!nextState);
      toast(err.message || 'Action failed.');
    }
  };

  const handleFriendAction = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (friendStatus === 'none') {
      try {
        await api(`/community/friends/request/${post.user_id}`, { method: 'POST' });
        setFriendStatus('pending_sent');
        toast('Friend request sent!');
      } catch (err) {
        toast(err.message || 'Failed to send request');
      }
    } else if (friendStatus === 'friends') {
      navigate(`/community/messages?partner=${post.user_id}`);
    }
  };

  const handleBlockUser = async () => {
    if (!window.confirm(`Block ${post.author_name}? You will no longer see their posts.`)) return;
    try {
      await api(`/community/block/${post.user_id}`, { method: 'POST' });
      toast(`Blocked ${post.author_name}.`);
      onPostDeleted(post.post_id);
    } catch (err) {
      alert(err.message || 'Failed to block user.');
    }
  };

  const handleSavePostEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api(`/community/posts/${post.post_id}`, {
        method: 'PATCH',
        body: {
          content: editContent,
          destination_tag: editTag || null
        }
      });
      onPostUpdated({
        ...post,
        content: editContent,
        destination_tag: editTag || null
      });
      setIsEditing(false);
      toast('Post updated successfully.');
    } catch (err) {
      alert(err.message || 'Failed to update post.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api(`/community/posts/${post.post_id}`, { method: 'DELETE' });
      onPostDeleted(post.post_id);
      toast('Post deleted.');
    } catch (err) {
      alert(err.message || 'Failed to delete post.');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/community/members/${post.user_id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast('Member profile link copied!');
    } else {
      toast(url);
    }
  };

  return (
    <article className="community-post-card">
      {/* Header */}
      <div className="post-header">
        <div className="post-author-group">
          <Link to={`/community/members/${post.user_id}`} className="post-avatar-link">
            <UserAvatar src={post.author_avatar} name={post.author_name} className="post-avatar" />
          </Link>
          <div className="post-author-details">
            <div className="post-author-name-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Link to={`/community/members/${post.user_id}`} className="post-author-name">
                {post.author_name}
              </Link>
              {post.author_role === 'admin' && (
                <span className="post-role-pill">Guide</span>
              )}
              {post.destination_tag && (
                <button
                  type="button"
                  className="post-dest-badge"
                  onClick={() => onSelectTag && onSelectTag(post.destination_tag)}
                  title={`Filter by ${post.destination_tag}`}
                >
                  📍 {post.destination_tag}
                </button>
              )}
            </div>
            <span className="post-timestamp">{timeAgo(post.created_at)}</span>
          </div>
        </div>

        {/* Social actions & Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isOwnPost && user && (
            <>
              <button
                type="button"
                className={`social-btn ${isFollowing ? 'active' : 'primary'}`}
                onClick={handleToggleFollow}
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
              >
                {isFollowing ? '✓ Following' : '+ Follow'}
              </button>

              {friendStatus === 'friends' ? (
                <button
                  type="button"
                  className="social-btn outline-green"
                  onClick={() => navigate(`/community/messages?partner=${post.user_id}`)}
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                >
                  💬 Message
                </button>
              ) : friendStatus === 'pending_sent' ? (
                <span style={{ fontSize: '0.76rem', color: 'var(--muted)', fontWeight: 600 }}>Request Sent</span>
              ) : (
                <button
                  type="button"
                  className="social-btn"
                  onClick={handleFriendAction}
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                >
                  👤 Add Friend
                </button>
              )}
            </>
          )}

          {/* More options dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="post-icon-action"
              onClick={() => setShowMenu(!showMenu)}
              title="More options"
            >
              •••
            </button>
            {showMenu && (
              <div
                style={{
                  position: 'absolute', right: 0, top: '28px', background: 'var(--card)',
                  border: '1px solid var(--line)', borderRadius: '10px', padding: '6px 0',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 10, minWidth: '150px'
                }}
              >
                {post.can_edit && (
                  <button
                    type="button"
                    style={{ width: '100%', textAlign: 'left', padding: '8px 14px', background: 'none', border: 'none', color: 'var(--ink)', fontSize: '0.82rem', cursor: 'pointer' }}
                    onClick={() => { setShowMenu(false); setIsEditing(true); }}
                  >
                    ✎ Edit Post
                  </button>
                )}
                {post.can_delete && (
                  <button
                    type="button"
                    style={{ width: '100%', textAlign: 'left', padding: '8px 14px', background: 'none', border: 'none', color: '#dc2626', fontSize: '0.82rem', cursor: 'pointer' }}
                    onClick={() => { setShowMenu(false); handleDeletePost(); }}
                  >
                    ✕ Delete Post
                  </button>
                )}
                {!isOwnPost && (
                  <>
                    <button
                      type="button"
                      style={{ width: '100%', textAlign: 'left', padding: '8px 14px', background: 'none', border: 'none', color: 'var(--ink)', fontSize: '0.82rem', cursor: 'pointer' }}
                      onClick={() => { setShowMenu(false); setReportTarget({ type: 'post', id: post.post_id }); setShowReportModal(true); }}
                    >
                      🚩 Report Post
                    </button>
                    <button
                      type="button"
                      style={{ width: '100%', textAlign: 'left', padding: '8px 14px', background: 'none', border: 'none', color: '#dc2626', fontSize: '0.82rem', cursor: 'pointer' }}
                      onClick={() => { setShowMenu(false); handleBlockUser(); }}
                    >
                      🚫 Block {post.author_name.split(' ')[0]}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post body text */}
      <p className="post-body-text">{post.content}</p>

      {/* Post attached media (video or multi-photo grid) */}
      {isVideoPost ? (
        <div className="post-video-wrap">
          <video controls src={mediaList[0].media_url} poster="/assets/images/placeholders/placeholder.svg" />
        </div>
      ) : mediaList.length > 0 ? (
        <div className={`post-media-grid count-${Math.min(mediaList.length, 4)}`}>
          {mediaList.slice(0, 4).map((item, idx) => (
            <div
              key={idx}
              className="post-media-cell"
              onClick={() => setLightboxIndex(idx)}
              role="button"
              tabIndex={0}
              aria-label={`View photo ${idx + 1}`}
            >
              <img
                src={item.media_url}
                alt={`Media ${idx + 1} attached by ${post.author_name}`}
                loading="lazy"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/images/placeholders/placeholder.svg'; }}
              />
              {idx === 3 && mediaList.length > 4 && (
                <div className="post-media-overlay">
                  +{mediaList.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {/* Action Toolbar */}
      <div className="post-actions-row">
        <div className="post-action-buttons">
          <button
            type="button"
            className={`post-action-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleToggleLike}
            aria-label={isLiked ? 'Unlike post' : 'Like post'}
          >
            <span className="heart" style={{ fontSize: '1.05rem', color: isLiked ? '#dc2626' : 'inherit' }}>
              {isLiked ? '♥' : '♡'}
            </span>
            <span>{likeCount}</span>
          </button>

          <button
            type="button"
            className={`post-action-btn ${showComments ? 'comment-active' : ''}`}
            onClick={() => setShowComments(!showComments)}
            aria-label="View comments"
          >
            <span>💬</span>
            <span>{commentCount}</span>
          </button>
        </div>

        <button
          type="button"
          className="post-action-btn"
          onClick={handleShare}
          title="Share post"
        >
          <span>↗</span> Share
        </button>
      </div>

      {/* Comments Drawer */}
      {showComments && (
        <PostCommentsSection
          postId={post.post_id}
          user={user}
          commentCount={commentCount}
          onCommentCountChange={setCommentCount}
        />
      )}

      {/* Photo Lightbox */}
      {lightboxIndex !== null && (
        <PostMediaLightbox
          photos={mediaList}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onSelectIndex={setLightboxIndex}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
        />
      )}

      {/* Edit Modal */}
      {isEditing && (
        <AdminModal
          title="Edit Travel Moment"
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          size="md"
          footer={
            <>
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
              <button type="button" className="admin-btn admin-btn-primary" onClick={handleSavePostEdit} disabled={submitting}>
                {submitting ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSavePostEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="admin-form-group">
              <label>Post Text</label>
              <textarea
                rows={4}
                required
                maxLength={3000}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
            </div>

            <div className="admin-form-group">
              <label>Destination Tag</label>
              <select value={editTag} onChange={(e) => setEditTag(e.target.value)}>
                <option value="">None</option>
                {POPULAR_DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </form>
        </AdminModal>
      )}
    </article>
  );
}

function CommunityFeed() {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    
    let url = '/community/posts?';
    if (search.trim()) url += `search=${encodeURIComponent(search.trim())}&`;
    if (selectedTag) url += `destination=${encodeURIComponent(selectedTag)}&`;

    api(url)
      .then(data => {
        if (active) {
          setPosts(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (active) {
          setError(err.message || 'Could not load community feed.');
          setLoading(false);
        }
      });

    return () => { active = false; };
  }, [search, selectedTag, refreshKey]);

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(prev => prev.map(p => p.post_id === updatedPost.post_id ? updatedPost : p));
  };

  const handlePostDeleted = (deletedId) => {
    setPosts(prev => prev.filter(p => p.post_id !== deletedId));
  };

  return (
    <main className="community-page">
      <PageIntro
        tag="Island Stories · Travelers’ Circle"
        title="Explore Lanka Community"
        text="Connect with fellow island explorers, share hidden viewpoints, and discover real-time moments from across Sri Lanka."
      />

      <div className="community-layout">
        {/* Main Feed Column */}
        <div className="community-feed-main">
          {/* Post Creator */}
          <CreatePostCard
            user={user}
            onPostCreated={handlePostCreated}
            onTagSelect={setSelectedTag}
          />

          {/* Search & Destination Tag Filter Bar */}
          <div className="community-feed-toolbar">
            <div className="feed-search-wrap">
              <span className="feed-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search posts, tips, or destinations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="feed-dest-select"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              aria-label="Filter by destination"
            >
              <option value="">All Destinations</option>
              {POPULAR_DESTINATIONS.map(d => <option key={d} value={d}>📍 {d}</option>)}
            </select>

            {(search || selectedTag) && (
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-sm"
                onClick={() => { setSearch(''); setSelectedTag(''); }}
              >
                Clear filters
              </button>
            )}

            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-icon"
              onClick={() => setRefreshKey(k => k + 1)}
              title="Refresh feed"
            >
              ↻
            </button>
          </div>

          {/* Feed Posts */}
          {loading ? (
            <div style={{ padding: '40px 0' }}><Loading /></div>
          ) : error ? (
            <div className="page-state error-state">
              <p>{error}</p>
              <button className="button button-green" onClick={() => setRefreshKey(k => k + 1)}>Retry</button>
            </div>
          ) : posts.length === 0 ? (
            <div className="admin-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🌴</div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem', color: 'var(--ink)' }}>No stories found</h3>
              <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: '0.9rem' }}>
                {search || selectedTag ? 'Try clearing your search query or choosing another destination.' : 'Be the first to share your Sri Lankan journey moment with the circle!'}
              </p>
              {(search || selectedTag) && (
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={() => { setSearch(''); setSelectedTag(''); }}
                >
                  View All Moments
                </button>
              )}
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.post_id}
                post={post}
                user={user}
                onPostUpdated={handlePostUpdated}
                onPostDeleted={handlePostDeleted}
                onSelectTag={(tag) => setSelectedTag(tag)}
              />
            ))
          )}
        </div>

        {/* Sidebar Widgets */}
        <aside className="community-sidebar">
          {/* Destination Tags Widget */}
          <div className="community-widget">
            <h3><span>📍</span> Popular Spots</h3>
            <p>Explore travel moments by iconic Sri Lankan destinations:</p>
            <div className="destination-tag-cloud">
              <button
                type="button"
                className={`dest-cloud-pill ${selectedTag === '' ? 'active' : ''}`}
                onClick={() => setSelectedTag('')}
              >
                All Spots
              </button>
              {POPULAR_DESTINATIONS.slice(0, 10).map(d => (
                <button
                  key={d}
                  type="button"
                  className={`dest-cloud-pill ${selectedTag === d ? 'active' : ''}`}
                  onClick={() => setSelectedTag(selectedTag === d ? '' : d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Community Guidelines */}
          <div className="community-widget">
            <h3><span>🌱</span> Community Guidelines</h3>
            <ul className="guidelines-list">
              <li><span>✓</span> Share authentic, personal recommendations and Sri Lanka travel experiences.</li>
              <li><span>✓</span> Keep photos original and respectful of local heritage sites and sacred temples.</li>
              <li><span>✓</span> Help fellow travelers with practical advice on trains, seasons, and local guides.</li>
              <li><span>✓</span> Be welcoming, kind, and supportive to all explorers.</li>
            </ul>
          </div>

          {/* Quick Profile Widget */}
          {user && (
            <div className="community-widget" style={{ background: 'linear-gradient(135deg, rgba(42, 122, 88, 0.06), rgba(108, 95, 192, 0.08))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                <UserAvatar src={user.profile_image} name={user.fullname} className="creator-avatar" />
                <div>
                  <strong style={{ fontSize: '0.98rem', display: 'block' }}>{user.fullname}</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{user.bio ? (user.bio.length > 40 ? user.bio.slice(0, 40) + '…' : user.bio) : 'Traveler on Explore Lanka'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link to={`/community/members/${user.user_id}`} className="admin-btn admin-btn-secondary admin-btn-sm" style={{ flex: 1 }}>
                  My Public Profile
                </Link>
                <Link to="/profile" className="admin-btn admin-btn-lavender admin-btn-sm" style={{ flex: 1 }}>
                  Edit Bio
                </Link>
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function MemberProfile() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [friendStatus, setFriendStatus] = useState('none');
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    setLoading(true);
    api(`/community/members/${id}`)
      .then(res => {
        if (active) {
          setData(res);
          setIsFollowing(Boolean(res.member.is_following));
          setFriendStatus(res.member.friend_status || 'none');
          setLoading(false);
        }
      })
      .catch(err => { if (active) { setError(err.message || 'Could not load member profile.'); setLoading(false); } });
    return () => { active = false; };
  }, [id]);

  const handleToggleFollow = async () => {
    if (!user) return navigate('/login');
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    try {
      await api(`/community/users/${id}/follow`, { method: nextState ? 'POST' : 'DELETE' });
      toast(nextState ? 'Following member' : 'Unfollowed member');
    } catch (err) {
      setIsFollowing(!nextState);
      toast(err.message);
    }
  };

  const handleFriendRequest = async () => {
    if (!user) return navigate('/login');
    try {
      await api(`/community/friends/request/${id}`, { method: 'POST' });
      setFriendStatus('pending_sent');
      toast('Friend request sent!');
    } catch (err) {
      toast(err.message);
    }
  };

  const handlePostUpdated = (updatedPost) => {
    setData(prev => ({
      ...prev,
      posts: prev.posts.map(p => p.post_id === updatedPost.post_id ? updatedPost : p)
    }));
  };

  const handlePostDeleted = (deletedId) => {
    setData(prev => ({
      ...prev,
      posts: prev.posts.filter(p => p.post_id !== deletedId),
      member: {
        ...prev.member,
        post_count: Math.max(0, prev.member.post_count - 1)
      }
    }));
  };

  if (loading) return <main className="community-page"><Loading /></main>;
  if (error || !data) return <main className="community-page"><ErrorState message={error || 'Member not found'} /></main>;

  const { member, posts } = data;
  const isOwnProfile = user?.user_id === member.user_id;

  return (
    <main className="community-page">
      <div style={{ marginBottom: '18px' }}>
        <Link to="/feed" className="text-link" style={{ fontSize: '0.88rem' }}>
          ← Back to Community Feed
        </Link>
      </div>

      {/* Member Profile Hero Header */}
      <div className="member-profile-header">
        <div className="member-profile-top">
          <div className="member-identity-group">
            <UserAvatar src={member.profile_image} name={member.fullname} className="member-avatar-lg" />
            <div className="member-titles">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1>{member.fullname}</h1>
                <span className="post-role-pill">
                  {member.role === 'admin' ? 'Official Guide & Admin' : 'Island Explorer'}
                </span>
              </div>
              <div className="member-handle-row">
                {member.city && <span>📍 {member.city}, {member.country || 'Sri Lanka'}</span>}
                <span>·</span>
                <span>Joined {member.joined_at ? new Date(member.joined_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'recently'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {isOwnProfile ? (
              <Link to="/profile" className="button button-green" style={{ padding: '8px 18px', minHeight: '38px', fontSize: '0.86rem' }}>
                Edit My Profile ✎
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  className={`social-btn ${isFollowing ? 'active' : 'primary'}`}
                  onClick={handleToggleFollow}
                >
                  {isFollowing ? '✓ Following' : '+ Follow'}
                </button>

                {friendStatus === 'friends' ? (
                  <Link to={`/community/messages?partner=${member.user_id}`} className="social-btn success">
                    💬 Direct Message
                  </Link>
                ) : friendStatus === 'pending_sent' ? (
                  <span className="social-btn">Request Sent</span>
                ) : (
                  <button type="button" className="social-btn outline-green" onClick={handleFriendRequest}>
                    👤 Add Friend
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {member.bio && (
          <p className="member-bio-text">{member.bio}</p>
        )}

        <div className="member-stats-bar">
          <div className="member-stat-box">
            <b>{member.post_count || 0}</b>
            <span>Moments Shared</span>
          </div>
          <div className="member-stat-box">
            <b>{member.likes_received || 0}</b>
            <span>Likes Received</span>
          </div>
          <div className="member-stat-box">
            <b>{member.followers_count || 0}</b>
            <span>Followers</span>
          </div>
          <div className="member-stat-box">
            <b>{member.following_count || 0}</b>
            <span>Following</span>
          </div>
        </div>
      </div>

      {/* Member's Shared Posts Feed */}
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--ink)' }}>
          {isOwnProfile ? 'Your Travel Moments' : `${member.fullname.split(' ')[0]}’s Travel Moments`}
        </h2>

        {posts.length === 0 ? (
          <div className="admin-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', margin: 0 }}>No moments published yet.</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.post_id}
              post={post}
              user={user}
              onPostUpdated={handlePostUpdated}
              onPostDeleted={handlePostDeleted}
            />
          ))
        )}
      </div>
    </main>
  );
}

function CommunityMessaging() {
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const initialPartnerId = Number(searchParams.get('partner')) || null;

  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const toast = useToast();

  // Load conversations list
  useEffect(() => {
    let active = true;
    api('/community/conversations')
      .then(res => {
        if (active) {
          setConversations(res);
          setLoading(false);
          if (initialPartnerId) {
            const found = res.find(c => c.partner_id === initialPartnerId);
            if (found) setActivePartner(found);
            else {
              api(`/community/members/${initialPartnerId}`).then(p => {
                if (active && p.member) {
                  const newConvo = {
                    partner_id: p.member.user_id,
                    partner_name: p.member.fullname,
                    partner_avatar: p.member.profile_image,
                    last_message: '',
                    unread_count: 0
                  };
                  setConversations(prev => [newConvo, ...prev]);
                  setActivePartner(newConvo);
                }
              });
            }
          } else if (res.length > 0 && !activePartner) {
            setActivePartner(res[0]);
          }
        }
      })
      .catch(err => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [initialPartnerId]);

  // Load message history with active partner
  useEffect(() => {
    if (!activePartner) return;
    let active = true;
    api(`/community/messages/${activePartner.partner_id}`)
      .then(res => { if (active) setMessages(res); })
      .catch(err => { if (active) toast(err.message); });

    const timer = setInterval(() => {
      api(`/community/messages/${activePartner.partner_id}`).then(res => {
        if (active) setMessages(res);
      }).catch(() => {});
    }, 5000);

    return () => { active = false; clearInterval(timer); };
  }, [activePartner]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || !activePartner) return;

    setSending(true);
    try {
      const sent = await api(`/community/messages/${activePartner.partner_id}`, {
        method: 'POST',
        body: { content: text }
      });
      setMessages(prev => [...prev, sent]);
      setNewMessage('');
    } catch (err) {
      alert(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="community-page">
      <PageIntro
        tag="Friends Circle · Private Messages"
        title="Explore Lanka Messages"
        text="Chat directly with connected Sri Lanka travel friends to share tips, itinerary details, and meetups."
      />

      <div className="chat-page">
        {/* Sidebar Conversations */}
        <aside className="chat-sidebar">
          <div className="chat-sidebar-header">
            <span>Conversations</span>
          </div>

          <div className="chat-convos-list">
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.86rem', color: 'var(--muted)' }}>Loading chats…</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '24px 18px', textAlign: 'center', fontSize: '0.84rem', color: 'var(--muted)' }}>
                No active conversations yet. Add friends from community posts or member profiles to start messaging!
              </div>
            ) : (
              conversations.map(convo => (
                <div
                  key={convo.partner_id}
                  className={`chat-convo-item ${activePartner?.partner_id === convo.partner_id ? 'active' : ''}`}
                  onClick={() => setActivePartner(convo)}
                >
                  <UserAvatar src={convo.partner_avatar} name={convo.partner_name} className="creator-avatar" />
                  <div className="chat-convo-info">
                    <div className="chat-convo-name">
                      <span>{convo.partner_name}</span>
                      {convo.unread_count > 0 && <span className="chat-unread-badge">{convo.unread_count}</span>}
                    </div>
                    <span className="chat-convo-preview">{convo.last_message || 'Start conversation'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main Chat Thread */}
        <div className="chat-main">
          {activePartner ? (
            <>
              <div className="chat-header">
                <div className="chat-header-user">
                  <UserAvatar src={activePartner.partner_avatar} name={activePartner.partner_name} className="creator-avatar" />
                  <div>
                    <strong style={{ fontSize: '0.96rem', color: 'var(--ink)' }}>{activePartner.partner_name}</strong>
                    <div style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>Explore Lanka Friend</div>
                  </div>
                </div>

                <Link to={`/community/members/${activePartner.partner_id}`} className="admin-btn admin-btn-secondary admin-btn-sm">
                  View Profile ↗
                </Link>
              </div>

              <div className="chat-messages-thread">
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--muted)', fontSize: '0.88rem' }}>
                    Say hello to {activePartner.partner_name}! Start planning your Sri Lankan adventure.
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.sender_id === user.user_id;
                    return (
                      <div key={msg.message_id} className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                        <p style={{ margin: 0 }}>{msg.content}</p>
                        <span className="chat-bubble-time">{timeAgo(msg.created_at)}</span>
                      </div>
                    );
                  })
                )}
              </div>

              <form className="chat-input-bar" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  className="chat-input-field"
                  placeholder={`Message ${activePartner.partner_name.split(' ')[0]}…`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  maxLength={2000}
                />
                <button
                  type="submit"
                  className="button button-green"
                  style={{ padding: '8px 18px', minHeight: '38px', fontSize: '0.84rem' }}
                  disabled={sending || !newMessage.trim()}
                >
                  {sending ? '…' : 'Send →'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', margin: 'auto', padding: '40px', color: 'var(--muted)' }}>
              Select a travel friend on the left to view messages.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Profile() {
  const { user, setUser } = useContext(AuthContext);
  const [form, setForm] = useState({
    fullname: user.fullname || '',
    phone: user.phone || '',
    bio: user.bio || '',
    city: user.city || '',
    country: user.country || 'Sri Lanka'
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);
    try {
      const updated = await api('/me', { method: 'PATCH', body: form });
      setUser(updated);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="account-page">
      <PageIntro
        tag="Your Member Profile"
        title="Account & Community Identity."
        text="Manage your public community bio, avatar photo, and contact details."
      />
      <form className="simple-form profile-form" onSubmit={submit}>
        {message && <p className="success-text">{message}</p>}
        {error && <p className="form-error">{error}</p>}

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <UserAvatar src={user.profile_image} name={user.fullname} className="member-avatar-lg" />
          <div>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', color: 'var(--ink)' }}>
              Profile Photo
            </span>
            <small style={{ color: 'var(--muted)' }}>Upload a picture for the community feed</small>
            <div style={{ marginTop: '8px' }}>
              <UploadImage
                kind="profiles"
                onUploaded={(name) => setUser({ ...user, profile_image: name })}
              />
            </div>
          </div>
        </div>

        <label>
          Display Name (Public)
          <input
            required
            minLength={2}
            value={form.fullname}
            onChange={(e) => setForm({ ...form, fullname: e.target.value })}
          />
        </label>

        <label>
          About You / Travel Bio (Public)
          <textarea
            rows={3}
            maxLength={500}
            placeholder="e.g. Wildlife photographer, surf enthusiast, and tea country wanderer based in Galle."
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
          <small style={{ color: 'var(--muted)' }}>{form.bio.length}/500 characters</small>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <label>
            City / Town
            <input
              placeholder="e.g. Kandy, Colombo, Galle"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </label>
          <label>
            Country
            <input
              placeholder="Sri Lanka"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </label>
        </div>

        <label>
          Email Address
          <input readOnly value={user.email} style={{ opacity: 0.75, cursor: 'not-allowed' }} />
          <div className="privacy-badge">🔒 Private · Never displayed on your public feed or profile</div>
        </label>

        <label>
          Phone (Optional)
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <div className="privacy-badge">🔒 Private · Kept confidential</div>
        </label>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginTop: '12px', flexWrap: 'wrap' }}>
          <button className="button button-green" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save profile changes'}
          </button>
          <Link to={`/community/members/${user.user_id}`} className="text-link" style={{ fontSize: '0.88rem' }}>
            View My Public Profile ↗
          </Link>
        </div>
      </form>
    </main>
  );
}
const SRI_LANKA_DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha',
  'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala',
  'Mannar', 'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'
];

const DESTINATION_CATEGORIES = [
  'Heritage & Ancient', 'Nature & Wildlife', 'Beaches & Coastline',
  'Hill Country & Tea', 'Culture & Temples', 'Adventure & Outdoors', 'Urban & Lifestyle'
];

const ACCOMMODATION_TYPES = [
  'Hotel', 'Guest House', 'Villa', 'Hostel', 'Bungalow', 'Homestay', 'Resort', 'Boutique Hotel'
];

function AdminBadge({ type = 'status', value = '' }) {
  const val = String(value || '').toLowerCase();
  let badgeClass = 'admin-badge';
  
  if (['active', 'approved', 'confirmed', 'replied', 'completed'].includes(val)) {
    badgeClass += ' badge-active';
  } else if (['pending', 'unread'].includes(val)) {
    badgeClass += ' badge-pending';
  } else if (['cancelled', 'rejected', 'inactive'].includes(val)) {
    badgeClass += ' badge-cancelled';
  } else if (val === 'read') {
    badgeClass += ' badge-read';
  } else if (val === 'admin') {
    badgeClass += ' badge-admin';
  } else if (val === 'user') {
    badgeClass += ' badge-user';
  } else if (val === 'sltda_import') {
    return <span className="admin-badge badge-dataset">SLTDA Dataset</span>;
  } else if (val === 'manual') {
    return <span className="admin-badge badge-manual">Custom Stay</span>;
  } else {
    badgeClass += ' badge-read';
  }

  return <span className={badgeClass}>{value || '—'}</span>;
}

function AdminRatingStars({ rating = 5 }) {
  const r = Math.max(1, Math.min(5, Math.round(Number(rating) || 5)));
  return <span className="admin-stars" title={`${r} out of 5 stars`}>{'★'.repeat(r)}{'☆'.repeat(5 - r)}</span>;
}

function AdminModal({ title, isOpen, onClose, size = 'md', children, footer }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className={`admin-modal modal-${size}`} onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2>{title}</h2>
          <button className="admin-modal-close" onClick={onClose} aria-label="Close modal">✕</button>
        </div>
        <div className="admin-modal-body">
          {children}
        </div>
        {footer && <div className="admin-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

function AdminConfirmModal({ isOpen, onClose, onConfirm, title = 'Confirm Action', message, confirmText = 'Confirm', isDanger = true }) {
  const [submitting, setSubmitting] = useState(false);
  if (!isOpen) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminModal title={title} isOpen={isOpen} onClose={onClose} size="sm" footer={
      <>
        <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
        <button type="button" className={`admin-btn ${isDanger ? 'admin-btn-danger' : 'admin-btn-primary'}`} onClick={handleConfirm} disabled={submitting}>
          {submitting ? 'Processing…' : confirmText}
        </button>
      </>
    }>
      <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>{message}</p>
    </AdminModal>
  );
}

function AdminDetailModal({ title, item, isOpen, onClose, fields = [], actions }) {
  if (!isOpen || !item) return null;

  return (
    <AdminModal title={title || 'Item Details'} isOpen={isOpen} onClose={onClose} size="lg" footer={
      <>
        {actions}
        <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>Close</button>
      </>
    }>
      <div className="admin-details-grid">
        {fields.map(({ key, label, fullWidth, render }) => (
          <div key={key} className={`admin-detail-item ${fullWidth ? 'full-width' : ''}`}>
            <span className="admin-detail-label">{label}</span>
            <div className="admin-detail-val">
              {render ? render(item[key], item) : (item[key] !== null && item[key] !== undefined && item[key] !== '' ? String(item[key]) : <em style={{ color: 'var(--muted)' }}>None</em>)}
            </div>
          </div>
        ))}
      </div>
    </AdminModal>
  );
}

function AdminTable({
  columns = [],
  data = [],
  loading = false,
  error = '',
  onRefresh,
  searchPlaceholder = 'Search records…',
  searchFields = [],
  filterConfigs = [],
  initialSort = { key: '', direction: 'desc' },
  pageSizeOptions = [10, 25, 50],
  emptyMessage = 'No matching records found.',
  addNewButton
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);

  const handleFilterChange = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
    setPage(1);
  };

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(item => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matches = searchFields.length > 0
          ? searchFields.some(field => String(item[field] || '').toLowerCase().includes(query))
          : Object.values(item).some(val => String(val || '').toLowerCase().includes(query));
        if (!matches) return false;
      }
      // Custom filters
      for (const [key, val] of Object.entries(filters)) {
        if (val && val !== 'ALL') {
          if (String(item[key] || '').toLowerCase() !== String(val).toLowerCase()) {
            return false;
          }
        }
      }
      return true;
    });
  }, [data, searchTerm, searchFields, filters]);

  const sortedData = useMemo(() => {
    if (!sort.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      let aVal = a[sort.key];
      let bVal = b[sort.key];
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';
      
      const numA = Number(aVal);
      const numB = Number(bVal);
      if (!Number.isNaN(numA) && !Number.isNaN(numB) && aVal !== '' && bVal !== '') {
        return sort.direction === 'asc' ? numA - numB : numB - numA;
      }
      return sort.direction === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredData, sort]);

  const totalRecords = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const toggleSort = (key) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="admin-table-container">
      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <div className="admin-search-box">
            <span className="admin-search-icon">🔍</span>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
          {filterConfigs.map(({ key, label, options }) => (
            <select
              key={key}
              className="admin-filter-select"
              value={filters[key] || 'ALL'}
              onChange={(e) => handleFilterChange(key, e.target.value)}
            >
              <option value="ALL">All {label}s</option>
              {options.map(opt => {
                const optVal = typeof opt === 'object' ? opt.value : opt;
                const optLabel = typeof opt === 'object' ? opt.label : opt;
                return <option key={optVal} value={optVal}>{optLabel}</option>;
              })}
            </select>
          ))}
        </div>
        <div className="admin-toolbar-right">
          {addNewButton}
          {onRefresh && (
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-icon"
              onClick={onRefresh}
              title="Refresh Data"
            >
              ↻
            </button>
          )}
        </div>
      </div>

      <div className="admin-table-card" style={{ marginTop: '14px' }}>
        {error ? (
          <div style={{ padding: '32px' }}><ErrorState message={error} /></div>
        ) : loading ? (
          <div style={{ padding: '48px 0' }}><Loading /></div>
        ) : paginatedData.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">📭</div>
            <h4 className="admin-empty-title">{emptyMessage}</h4>
            <p className="admin-empty-desc">Try clearing your search query or selecting different filters.</p>
            {(searchTerm || Object.values(filters).some(v => v && v !== 'ALL')) && (
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-sm"
                onClick={() => { setSearchTerm(''); setFilters({}); }}
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="admin-table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  {columns.map(col => (
                    <th
                      key={col.key}
                      className={col.sortable ? 'sortable' : ''}
                      onClick={() => col.sortable && toggleSort(col.key)}
                      style={col.width ? { width: col.width } : undefined}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {col.label}
                        {col.sortable && (
                          <span style={{ fontSize: '0.65rem', opacity: sort.key === col.key ? 1 : 0.35 }}>
                            {sort.key === col.key ? (sort.direction === 'asc' ? '▲' : '▼') : '↕'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, idx) => (
                  <tr key={row[columns[0]?.rowKey || 'id'] || idx}>
                    {columns.map(col => (
                      <td key={col.key} style={col.align ? { textAlign: col.align } : undefined}>
                        {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && totalRecords > 0 && (
          <div className="admin-pagination-bar">
            <div>
              Showing <b>{Math.min(totalRecords, (currentPage - 1) * pageSize + 1)}</b> to{' '}
              <b>{Math.min(totalRecords, currentPage * pageSize)}</b> of <b>{totalRecords}</b> records
            </div>
            <div className="admin-pagination-controls">
              <select
                className="admin-filter-select"
                style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              >
                {pageSizeOptions.map(sz => <option key={sz} value={sz}>{sz} per page</option>)}
              </select>
              <button
                type="button"
                className="admin-page-btn"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
                aria-label="Previous page"
              >
                ‹
              </button>
              <span style={{ padding: '0 6px', fontWeight: 600, fontSize: '0.8rem' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="admin-page-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminOverview({ summary, setSection, onRefresh }) {
  const data = summary.data || {};
  const loading = summary.loading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Metric Cards Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card card-mint" onClick={() => setSection('places')}>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Destinations</span>
            <div className="admin-stat-number">{loading ? '…' : data.places ?? 0}</div>
            <span className="admin-stat-subtext">Active spots & citadels →</span>
          </div>
          <div className="admin-stat-icon-wrap icon-mint">📍</div>
        </div>

        <div className="admin-stat-card card-sky" onClick={() => setSection('hotels')}>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Stays & Lodgings</span>
            <div className="admin-stat-number">{loading ? '…' : Number(data.hotels || 0).toLocaleString()}</div>
            <span className="admin-stat-subtext">3,649+ SLTDA registered →</span>
          </div>
          <div className="admin-stat-icon-wrap icon-sky">🏨</div>
        </div>

        <div className="admin-stat-card card-lavender" onClick={() => setSection('bookings')}>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total Bookings</span>
            <div className="admin-stat-number">{loading ? '…' : data.bookings ?? 0}</div>
            <span className="admin-stat-subtext">Reservations & stays →</span>
          </div>
          <div className="admin-stat-icon-wrap icon-lavender">📋</div>
        </div>

        <div className="admin-stat-card card-gold" onClick={() => setSection('users')}>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Registered Users</span>
            <div className="admin-stat-number">{loading ? '…' : data.users ?? 0}</div>
            <span className="admin-stat-subtext">Travelers & staff →</span>
          </div>
          <div className="admin-stat-icon-wrap icon-gold">👥</div>
        </div>

        <div className="admin-stat-card card-sky" onClick={() => setSection('contacts')}>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Unread Messages</span>
            <div className="admin-stat-number">{loading ? '…' : data.unreadMessages ?? 0}</div>
            <span className="admin-stat-subtext" style={data.unreadMessages > 0 ? { color: 'var(--sky)', fontWeight: 700 } : {}}>
              {data.unreadMessages > 0 ? 'Action required →' : 'All inquiries caught up'}
            </span>
          </div>
          <div className="admin-stat-icon-wrap icon-sky">✉️</div>
        </div>

        <div className="admin-stat-card card-lavender" onClick={() => setSection('reviews')}>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Pending Reviews</span>
            <div className="admin-stat-number">{loading ? '…' : data.pendingReviews ?? 0}</div>
            <span className="admin-stat-subtext" style={data.pendingReviews > 0 ? { color: 'var(--lavender)', fontWeight: 700 } : {}}>
              {data.pendingReviews > 0 ? 'Moderation pending →' : 'No pending reviews'}
            </span>
          </div>
          <div className="admin-stat-icon-wrap icon-lavender">⭐</div>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="admin-card" style={{ background: 'linear-gradient(135deg, rgba(42, 122, 88, 0.08), rgba(108, 95, 192, 0.08))' }}>
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700 }}>Quick Administration Actions</h3>
            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--muted)' }}>Quickly jump into active content management and moderation tasks.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button type="button" className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => setSection('places')}>
              + Add Destination
            </button>
            <button type="button" className="admin-btn admin-btn-lavender admin-btn-sm" onClick={() => setSection('hotels')}>
              + Add Stay
            </button>
            <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setSection('bookings')}>
              View Bookings
            </button>
            <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setSection('contacts')}>
              Inquiries
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Activity Grid */}
      <div className="admin-overview-grid">
        {/* Recent Bookings */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3><span>📅</span> Recent Bookings</h3>
            <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setSection('bookings')}>
              View All →
            </button>
          </div>
          <div className="admin-card-body">
            {loading ? (
              <Loading />
            ) : !data.recentBookings?.length ? (
              <p style={{ color: 'var(--muted)', textAlign: 'center', margin: '20px 0' }}>No recent bookings recorded.</p>
            ) : (
              <div className="admin-activity-list">
                {data.recentBookings.map(b => (
                  <div key={b.booking_id} className="admin-activity-item">
                    <div className="admin-activity-main">
                      <div className="admin-activity-title">
                        <span>{b.booking_ref}</span>
                        <AdminBadge value={b.status} />
                      </div>
                      <span className="admin-activity-meta">
                        {b.hotel_name || 'Hotel'} ({b.room_name || 'Room'}) · {b.user_name || 'Guest'}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>
                        LKR {Number(b.total_amount || 0).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Inquiries & Pending Feedback */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Recent Inquiries */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3><span>✉️</span> Guest Inquiries</h3>
              <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setSection('contacts')}>
                View All →
              </button>
            </div>
            <div className="admin-card-body">
              {loading ? (
                <Loading />
              ) : !data.recentMessages?.length ? (
                <p style={{ color: 'var(--muted)', textAlign: 'center', margin: '12px 0' }}>No recent guest messages.</p>
              ) : (
                <div className="admin-activity-list">
                  {data.recentMessages.slice(0, 3).map(m => (
                    <div key={m.contact_id} className="admin-activity-item" style={{ cursor: 'pointer' }} onClick={() => setSection('contacts')}>
                      <div className="admin-activity-main">
                        <div className="admin-activity-title">
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                            {m.subject || 'Inquiry'}
                          </span>
                          <AdminBadge value={m.status} />
                        </div>
                        <span className="admin-activity-meta">From: {m.fullname} ({m.email})</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>↗</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pending Reviews */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3><span>⭐</span> Reviews for Moderation</h3>
              <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setSection('reviews')}>
                Manage →
              </button>
            </div>
            <div className="admin-card-body">
              {loading ? (
                <Loading />
              ) : !data.recentReviews?.length ? (
                <p style={{ color: 'var(--muted)', textAlign: 'center', margin: '12px 0' }}>No reviews currently pending moderation.</p>
              ) : (
                <div className="admin-activity-list">
                  {data.recentReviews.map(r => (
                    <div key={r.id} className="admin-activity-item">
                      <div className="admin-activity-main">
                        <div className="admin-activity-title">
                          <span>{r.target_name || 'Destination'}</span>
                          <AdminRatingStars rating={r.rating} />
                        </div>
                        <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                          "{r.comment ? (r.comment.length > 70 ? r.comment.slice(0, 70) + '…' : r.comment) : 'No comment'}"
                        </p>
                        <span className="admin-activity-meta" style={{ marginTop: '2px' }}>By: {r.author}</span>
                      </div>
                      <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setSection('reviews')}>
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPlaces({ onNotice }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useAsync(() => api('/admin/places'), [refreshKey]);
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | 'view'
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setForm({
      product_name: '',
      district: 'Matale',
      category: 'Heritage & Ancient',
      short_description: '',
      description: '',
      facilities: '',
      image: '',
      status: 'active'
    });
    setFormError('');
    setModalMode('create');
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    setForm({
      product_name: item.product_name || '',
      district: item.district || 'Matale',
      category: item.category || 'Heritage & Ancient',
      short_description: item.short_description || '',
      description: item.description || '',
      facilities: item.facilities || '',
      image: item.image || '',
      status: item.status || 'active'
    });
    setFormError('');
    setModalMode('edit');
  };

  const openView = (item) => {
    setSelectedItem(item);
    setModalMode('view');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.product_name?.trim()) {
      setFormError('Destination name is required.');
      return;
    }
    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        await api('/admin/places', { method: 'POST', body: form });
        onNotice('Destination created successfully.');
      } else {
        await api(`/admin/places/${selectedItem.product_id}`, { method: 'PATCH', body: form });
        onNotice('Destination updated successfully.');
      }
      setModalMode(null);
      setRefreshKey(k => k + 1);
    } catch (err) {
      setFormError(err.message || 'Failed to save destination.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api(`/admin/places/${confirmDelete.product_id}`, { method: 'DELETE' });
      onNotice('Destination deleted successfully.');
      setConfirmDelete(null);
      setRefreshKey(k => k + 1);
    } catch (err) {
      onNotice(`Error: ${err.message}`);
    }
  };

  const columns = [
    {
      key: 'product_id',
      label: 'ID',
      width: '60px',
      sortable: true,
      rowKey: 'product_id'
    },
    {
      key: 'product_name',
      label: 'Destination',
      sortable: true,
      render: (val, row) => (
        <div className="admin-table-item-cell">
          <img
            className="admin-table-thumb"
            src={photoFor(row)}
            alt={val}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/images/placeholders/placeholder.svg'; }}
          />
          <div className="admin-item-text">
            <span className="admin-item-title">{val}</span>
            <span className="admin-item-sub">{row.district} · {row.category}</span>
          </div>
        </div>
      )
    },
    {
      key: 'district',
      label: 'District',
      sortable: true
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '110px',
      render: (val) => <AdminBadge value={val} />
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '150px',
      align: 'right',
      render: (_, row) => (
        <div className="admin-actions-cell">
          <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => openView(row)} title="View details">
            View
          </button>
          <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => openEdit(row)} title="Edit destination">
            Edit
          </button>
          <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" style={{ color: '#dc2626' }} onClick={() => setConfirmDelete(row)} title="Delete destination">
            ✕
          </button>
        </div>
      )
    }
  ];

  return (
    <>
      <AdminTable
        columns={columns}
        data={data}
        loading={loading}
        error={error}
        onRefresh={() => setRefreshKey(k => k + 1)}
        searchPlaceholder="Search destinations by name, district, category…"
        searchFields={['product_name', 'district', 'category', 'short_description']}
        filterConfigs={[
          { key: 'district', label: 'District', options: SRI_LANKA_DISTRICTS },
          { key: 'category', label: 'Category', options: DESTINATION_CATEGORIES },
          { key: 'status', label: 'Status', options: ['active', 'inactive'] }
        ]}
        initialSort={{ key: 'product_id', direction: 'desc' }}
        addNewButton={
          <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}>
            + Add Destination
          </button>
        }
      />

      {/* Create / Edit Form Modal */}
      <AdminModal
        title={modalMode === 'create' ? 'Add New Destination' : `Edit: ${selectedItem?.product_name}`}
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        onClose={() => setModalMode(null)}
        size="lg"
        footer={
          <>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setModalMode(null)} disabled={submitting}>Cancel</button>
            <button type="button" className="admin-btn admin-btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving…' : (modalMode === 'create' ? 'Create Destination' : 'Save Changes')}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && <div className="admin-notice-banner admin-notice-error">{formError}</div>}
          <div className="admin-form-grid">
            <div className="admin-form-group col-span-2">
              <label>Destination Name *</label>
              <input
                required
                type="text"
                placeholder="e.g. Sigiriya Rock Fortress"
                value={form.product_name || ''}
                onChange={e => setForm({ ...form, product_name: e.target.value })}
              />
            </div>

            <div className="admin-form-group">
              <label>District *</label>
              <select
                value={form.district || 'Matale'}
                onChange={e => setForm({ ...form, district: e.target.value })}
              >
                {SRI_LANKA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="admin-form-group">
              <label>Category *</label>
              <select
                value={form.category || 'Heritage & Ancient'}
                onChange={e => setForm({ ...form, category: e.target.value })}
              >
                {DESTINATION_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="admin-form-group col-span-2">
              <label>Short Description (for card preview)</label>
              <input
                type="text"
                placeholder="Brief highlight, e.g. Ancient palace perched on a towering rock monolith"
                value={form.short_description || ''}
                onChange={e => setForm({ ...form, short_description: e.target.value })}
              />
            </div>

            <div className="admin-form-group col-span-2">
              <label>Full Description</label>
              <textarea
                rows={4}
                placeholder="Detailed guide and historical context about the destination…"
                value={form.description || ''}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="admin-form-group col-span-2">
              <label>Key Facilities / Highlights</label>
              <input
                type="text"
                placeholder="e.g. Guided Tours, Museum, Parking, Refreshments"
                value={form.facilities || ''}
                onChange={e => setForm({ ...form, facilities: e.target.value })}
              />
              <span className="admin-form-hint">Separate items with commas</span>
            </div>

            <div className="admin-form-group col-span-2">
              <label>Image Upload or Path</label>
              <UploadImage kind="products" onUploaded={name => setForm({ ...form, image: `/uploads/products/${name}` })} />
              <input
                type="text"
                placeholder="Image path, e.g. Sigiriya/1. Sigiriya Rock Fortress.jpg or upload above"
                value={form.image || ''}
                onChange={e => setForm({ ...form, image: e.target.value })}
                style={{ marginTop: '8px' }}
              />
            </div>

            <div className="admin-form-group">
              <label>Status</label>
              <select
                value={form.status || 'active'}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Active (Visible)</option>
                <option value="inactive">Inactive (Hidden)</option>
              </select>
            </div>
          </div>
        </form>
      </AdminModal>

      {/* View Details Modal */}
      <AdminDetailModal
        title={selectedItem?.product_name}
        item={selectedItem}
        isOpen={modalMode === 'view'}
        onClose={() => setModalMode(null)}
        actions={
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => { openEdit(selectedItem); }}>
            Edit Destination
          </button>
        }
        fields={[
          { key: 'product_id', label: 'ID' },
          { key: 'product_name', label: 'Name' },
          { key: 'district', label: 'District' },
          { key: 'category', label: 'Category' },
          { key: 'status', label: 'Status', render: v => <AdminBadge value={v} /> },
          {
            key: 'image',
            label: 'Photo',
            fullWidth: true,
            render: (_, item) => (
              <img
                src={photoFor(item)}
                alt={item.product_name}
                style={{ maxHeight: '200px', borderRadius: '8px', objectFit: 'cover' }}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/images/placeholders/placeholder.svg'; }}
              />
            )
          },
          { key: 'short_description', label: 'Short Description', fullWidth: true },
          { key: 'description', label: 'Full Description', fullWidth: true },
          { key: 'facilities', label: 'Facilities & Highlights', fullWidth: true }
        ]}
      />

      {/* Confirm Delete Modal */}
      <AdminConfirmModal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Destination"
        message={`Are you sure you want to permanently delete "${confirmDelete?.product_name}"? This action cannot be undone.`}
        confirmText="Delete Destination"
      />
    </>
  );
}

function AdminFeatures({ onNotice }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useAsync(() => api('/admin/features'), [refreshKey]);
  const [modalMode, setModalMode] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setForm({ features_name: '', slug: '', description: '', facilities: '', image: '', status: 'active' });
    setFormError('');
    setModalMode('create');
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    setForm({
      features_name: item.features_name || '',
      slug: item.slug || '',
      description: item.description || '',
      facilities: item.facilities || '',
      image: item.image || '',
      status: item.status || 'active'
    });
    setFormError('');
    setModalMode('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.features_name?.trim()) {
      setFormError('Experience title is required.');
      return;
    }
    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        await api('/admin/features', { method: 'POST', body: form });
        onNotice('Experience created successfully.');
      } else {
        await api(`/admin/features/${selectedItem.features_id}`, { method: 'PATCH', body: form });
        onNotice('Experience updated successfully.');
      }
      setModalMode(null);
      setRefreshKey(k => k + 1);
    } catch (err) {
      setFormError(err.message || 'Failed to save experience.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api(`/admin/features/${confirmDelete.features_id}`, { method: 'DELETE' });
      onNotice('Experience deleted successfully.');
      setConfirmDelete(null);
      setRefreshKey(k => k + 1);
    } catch (err) {
      onNotice(`Error: ${err.message}`);
    }
  };

  const columns = [
    { key: 'features_id', label: 'ID', width: '60px', sortable: true, rowKey: 'features_id' },
    {
      key: 'features_name',
      label: 'Experience Title',
      sortable: true,
      render: (val, row) => (
        <div className="admin-item-text">
          <span className="admin-item-title">{val}</span>
          <span className="admin-item-sub">Slug: {row.slug || '—'}</span>
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      render: (val) => <span style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>{val ? (val.length > 70 ? val.slice(0, 70) + '…' : val) : '—'}</span>
    },
    { key: 'status', label: 'Status', width: '110px', sortable: true, render: v => <AdminBadge value={v} /> },
    {
      key: 'actions',
      label: 'Actions',
      width: '150px',
      align: 'right',
      render: (_, row) => (
        <div className="admin-actions-cell">
          <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => { setSelectedItem(row); setModalMode('view'); }}>
            View
          </button>
          <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => openEdit(row)}>
            Edit
          </button>
          <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" style={{ color: '#dc2626' }} onClick={() => setConfirmDelete(row)}>
            ✕
          </button>
        </div>
      )
    }
  ];

  return (
    <>
      <AdminTable
        columns={columns}
        data={data}
        loading={loading}
        error={error}
        onRefresh={() => setRefreshKey(k => k + 1)}
        searchPlaceholder="Search experiences…"
        searchFields={['features_name', 'slug', 'description']}
        filterConfigs={[{ key: 'status', label: 'Status', options: ['active', 'inactive'] }]}
        addNewButton={
          <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}>
            + Add Experience
          </button>
        }
      />

      <AdminModal
        title={modalMode === 'create' ? 'Add Experience' : `Edit: ${selectedItem?.features_name}`}
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        onClose={() => setModalMode(null)}
        footer={
          <>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setModalMode(null)} disabled={submitting}>Cancel</button>
            <button type="button" className="admin-btn admin-btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Experience'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && <div className="admin-notice-banner admin-notice-error">{formError}</div>}
          <div className="admin-form-grid">
            <div className="admin-form-group col-span-2">
              <label>Experience Title *</label>
              <input required value={form.features_name || ''} onChange={e => setForm({ ...form, features_name: e.target.value })} />
            </div>
            <div className="admin-form-group">
              <label>URL Slug</label>
              <input placeholder="e.g. scenic-trains" value={form.slug || ''} onChange={e => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div className="admin-form-group">
              <label>Status</label>
              <select value={form.status || 'active'} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="admin-form-group col-span-2">
              <label>Description</label>
              <textarea rows={4} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="admin-form-group col-span-2">
              <label>Facilities</label>
              <input value={form.facilities || ''} onChange={e => setForm({ ...form, facilities: e.target.value })} />
            </div>
            <div className="admin-form-group col-span-2">
              <label>Image</label>
              <UploadImage kind="features" onUploaded={name => setForm({ ...form, image: `/uploads/features/${name}` })} />
              <input placeholder="Image path or upload above" value={form.image || ''} onChange={e => setForm({ ...form, image: e.target.value })} style={{ marginTop: '8px' }} />
            </div>
          </div>
        </form>
      </AdminModal>

      <AdminDetailModal
        title={selectedItem?.features_name}
        item={selectedItem}
        isOpen={modalMode === 'view'}
        onClose={() => setModalMode(null)}
        actions={<button type="button" className="admin-btn admin-btn-primary" onClick={() => openEdit(selectedItem)}>Edit</button>}
        fields={[
          { key: 'features_id', label: 'ID' },
          { key: 'features_name', label: 'Title' },
          { key: 'slug', label: 'Slug' },
          { key: 'status', label: 'Status', render: v => <AdminBadge value={v} /> },
          { key: 'description', label: 'Description', fullWidth: true },
          { key: 'facilities', label: 'Facilities', fullWidth: true }
        ]}
      />

      <AdminConfirmModal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Experience"
        message={`Delete "${confirmDelete?.features_name}" permanently?`}
      />
    </>
  );
}

function AdminHotels({ onNotice }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useAsync(() => api('/admin/hotels'), [refreshKey]);
  const [modalMode, setModalMode] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setForm({
      hotel_name: '',
      slug: '',
      accommodation_type: 'Hotel',
      district: 'Colombo',
      city: '',
      address: '',
      star_category: 3,
      grade: '',
      phone: '',
      mobile: '',
      email: '',
      website: '',
      booking_link: '',
      registration_number: '',
      licence_status: 'Licensed',
      record_status: 'Active',
      short_desc: '',
      description: '',
      facilities: '',
      main_image: '',
      status: 'active',
      dataset_source: 'manual'
    });
    setFormError('');
    setModalMode('create');
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    setForm({
      hotel_name: item.hotel_name || '',
      slug: item.slug || '',
      accommodation_type: item.accommodation_type || 'Hotel',
      district: item.district || '',
      city: item.city || '',
      address: item.address || '',
      star_category: item.star_category || 3,
      grade: item.grade || '',
      phone: item.phone || '',
      mobile: item.mobile || '',
      email: item.email || '',
      website: item.website || '',
      booking_link: item.booking_link || '',
      registration_number: item.registration_number || '',
      licence_status: item.licence_status || 'Licensed',
      record_status: item.record_status || 'Active',
      short_desc: item.short_desc || '',
      description: item.description || '',
      facilities: item.facilities || '',
      main_image: item.main_image || '',
      status: item.status || 'active',
      dataset_source: item.dataset_source || 'manual'
    });
    setFormError('');
    setModalMode('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.hotel_name?.trim()) {
      setFormError('Stay name is required.');
      return;
    }
    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        await api('/admin/hotels', { method: 'POST', body: form });
        onNotice('Stay accommodation added successfully.');
      } else {
        await api(`/admin/hotels/${selectedItem.hotel_id}`, { method: 'PATCH', body: form });
        onNotice('Stay accommodation updated successfully.');
      }
      setModalMode(null);
      setRefreshKey(k => k + 1);
    } catch (err) {
      setFormError(err.message || 'Failed to save stay details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api(`/admin/hotels/${confirmDelete.hotel_id}`, { method: 'DELETE' });
      onNotice('Stay record deleted successfully.');
      setConfirmDelete(null);
      setRefreshKey(k => k + 1);
    } catch (err) {
      onNotice(`Error: ${err.message}`);
    }
  };

  const columns = [
    { key: 'hotel_id', label: 'ID', width: '60px', sortable: true, rowKey: 'hotel_id' },
    {
      key: 'hotel_name',
      label: 'Stay Name',
      sortable: true,
      render: (val, row) => (
        <div className="admin-table-item-cell">
          <img
            className="admin-table-thumb"
            src={photoFor(row)}
            alt={val}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = HOTEL_PLACEHOLDER; }}
          />
          <div className="admin-item-text">
            <span className="admin-item-title">{val}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span className="admin-item-sub">{row.city || row.district || 'Sri Lanka'}</span>
              <AdminBadge value={row.dataset_source} />
            </div>
          </div>
        </div>
      )
    },
    { key: 'accommodation_type', label: 'Type', sortable: true, render: v => v || 'Hotel' },
    { key: 'district', label: 'District', sortable: true },
    {
      key: 'star_category',
      label: 'Rating / Grade',
      sortable: true,
      render: (v, r) => r.grade ? `${r.grade} (${v || '—'}★)` : `${v || 3}★`
    },
    { key: 'status', label: 'Status', width: '100px', sortable: true, render: v => <AdminBadge value={v} /> },
    {
      key: 'actions',
      label: 'Actions',
      width: '150px',
      align: 'right',
      render: (_, row) => (
        <div className="admin-actions-cell">
          <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => { setSelectedItem(row); setModalMode('view'); }}>
            View
          </button>
          <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => openEdit(row)}>
            Edit
          </button>
          <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" style={{ color: '#dc2626' }} onClick={() => setConfirmDelete(row)}>
            ✕
          </button>
        </div>
      )
    }
  ];

  return (
    <>
      <AdminTable
        columns={columns}
        data={data}
        loading={loading}
        error={error}
        onRefresh={() => setRefreshKey(k => k + 1)}
        searchPlaceholder="Search stays by name, district, type, registration…"
        searchFields={['hotel_name', 'district', 'city', 'accommodation_type', 'registration_number', 'email']}
        filterConfigs={[
          { key: 'district', label: 'District', options: SRI_LANKA_DISTRICTS },
          { key: 'accommodation_type', label: 'Type', options: ACCOMMODATION_TYPES },
          { key: 'dataset_source', label: 'Source', options: [{ value: 'sltda_import', label: 'SLTDA Dataset' }, { value: 'manual', label: 'Custom Stays' }] },
          { key: 'status', label: 'Status', options: ['active', 'inactive'] }
        ]}
        initialSort={{ key: 'hotel_id', direction: 'asc' }}
        addNewButton={
          <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}>
            + Add Stay
          </button>
        }
      />

      {/* Create / Edit Form Modal */}
      <AdminModal
        title={modalMode === 'create' ? 'Add New Stay' : `Edit: ${selectedItem?.hotel_name}`}
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        onClose={() => setModalMode(null)}
        size="lg"
        footer={
          <>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setModalMode(null)} disabled={submitting}>Cancel</button>
            <button type="button" className="admin-btn admin-btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Stay Details'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && <div className="admin-notice-banner admin-notice-error">{formError}</div>}
          {selectedItem?.dataset_source === 'sltda_import' && (
            <div className="admin-notice-banner admin-notice-info">
              ℹ️ This stay is imported from the official SLTDA open dataset (Reg: {selectedItem.registration_number || 'N/A'}).
            </div>
          )}
          <div className="admin-form-grid">
            <div className="admin-form-group col-span-2">
              <label>Stay / Hotel Name *</label>
              <input required value={form.hotel_name || ''} onChange={e => setForm({ ...form, hotel_name: e.target.value })} />
            </div>

            <div className="admin-form-group">
              <label>Accommodation Type</label>
              <select value={form.accommodation_type || 'Hotel'} onChange={e => setForm({ ...form, accommodation_type: e.target.value })}>
                {ACCOMMODATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="admin-form-group">
              <label>District</label>
              <select value={form.district || 'Colombo'} onChange={e => setForm({ ...form, district: e.target.value })}>
                {SRI_LANKA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="admin-form-group">
              <label>City / Town</label>
              <input placeholder="e.g. Ella, Kandy, Galle" value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} />
            </div>

            <div className="admin-form-group">
              <label>Star Category (1–5)</label>
              <select value={form.star_category || 3} onChange={e => setForm({ ...form, star_category: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Star</option>)}
              </select>
            </div>

            <div className="admin-form-group col-span-2">
              <label>Address</label>
              <input value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>

            <div className="admin-form-group">
              <label>Phone / Landline</label>
              <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>

            <div className="admin-form-group">
              <label>Mobile</label>
              <input value={form.mobile || ''} onChange={e => setForm({ ...form, mobile: e.target.value })} />
            </div>

            <div className="admin-form-group">
              <label>Email Address</label>
              <input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>

            <div className="admin-form-group">
              <label>Website</label>
              <input placeholder="https://…" value={form.website || ''} onChange={e => setForm({ ...form, website: e.target.value })} />
            </div>

            <div className="admin-form-group col-span-2">
              <label>Booking Link</label>
              <input placeholder="Direct booking link or Booking.com URL" value={form.booking_link || ''} onChange={e => setForm({ ...form, booking_link: e.target.value })} />
            </div>

            <div className="admin-form-group">
              <label>SLTDA Reg Number</label>
              <input value={form.registration_number || ''} onChange={e => setForm({ ...form, registration_number: e.target.value })} />
            </div>

            <div className="admin-form-group">
              <label>Licence Status</label>
              <input value={form.licence_status || 'Licensed'} onChange={e => setForm({ ...form, licence_status: e.target.value })} />
            </div>

            <div className="admin-form-group col-span-2">
              <label>Short Summary</label>
              <input value={form.short_desc || ''} onChange={e => setForm({ ...form, short_desc: e.target.value })} />
            </div>

            <div className="admin-form-group col-span-2">
              <label>Full Description</label>
              <textarea rows={3} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="admin-form-group col-span-2">
              <label>Image Upload or Path</label>
              <UploadImage kind="hotels" onUploaded={name => setForm({ ...form, main_image: `/uploads/hotels/${name}` })} />
              <input placeholder="Image path or upload above" value={form.main_image || ''} onChange={e => setForm({ ...form, main_image: e.target.value })} style={{ marginTop: '8px' }} />
            </div>

            <div className="admin-form-group">
              <label>Status</label>
              <select value={form.status || 'active'} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </form>
      </AdminModal>

      {/* View Details Modal */}
      <AdminDetailModal
        title={selectedItem?.hotel_name}
        item={selectedItem}
        isOpen={modalMode === 'view'}
        onClose={() => setModalMode(null)}
        actions={<button type="button" className="admin-btn admin-btn-primary" onClick={() => openEdit(selectedItem)}>Edit Stay</button>}
        fields={[
          { key: 'hotel_id', label: 'ID' },
          { key: 'hotel_name', label: 'Stay Name' },
          { key: 'accommodation_type', label: 'Type' },
          { key: 'district', label: 'District' },
          { key: 'city', label: 'City' },
          { key: 'star_category', label: 'Stars', render: v => `${v || 3} Stars` },
          { key: 'grade', label: 'SLTDA Grade' },
          { key: 'registration_number', label: 'Registration Number' },
          { key: 'licence_status', label: 'Licence Status' },
          { key: 'dataset_source', label: 'Source', render: v => <AdminBadge value={v} /> },
          { key: 'status', label: 'Status', render: v => <AdminBadge value={v} /> },
          { key: 'phone', label: 'Phone' },
          { key: 'mobile', label: 'Mobile' },
          { key: 'email', label: 'Email' },
          { key: 'website', label: 'Website', render: v => v ? <a href={v} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--lavender)' }}>{v} ↗</a> : '—' },
          { key: 'booking_link', label: 'Booking Link', render: v => v ? <a href={v} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green)' }}>Open Link ↗</a> : '—' },
          { key: 'address', label: 'Address', fullWidth: true },
          { key: 'short_desc', label: 'Summary', fullWidth: true },
          { key: 'description', label: 'Full Description', fullWidth: true },
          { key: 'facilities', label: 'Facilities', fullWidth: true }
        ]}
      />

      <AdminConfirmModal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Stay"
        message={`Delete stay record "${confirmDelete?.hotel_name}" permanently?`}
      />
    </>
  );
}

function AdminRooms({ onNotice }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useAsync(() => api('/admin/rooms'), [refreshKey]);
  const [modalMode, setModalMode] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setForm({
      hotel_id: 1,
      room_name: '',
      description: '',
      capacity: 2,
      price_per_night: 15000,
      available_count: 5,
      beds: '1 King Bed',
      bed_type: 'King',
      facilities: 'Free Wi-Fi, Air Conditioning, Balcony',
      main_image: '',
      status: 'active'
    });
    setFormError('');
    setModalMode('create');
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    setForm({
      hotel_id: item.hotel_id || 1,
      room_name: item.room_name || '',
      description: item.description || '',
      capacity: item.capacity || 2,
      price_per_night: item.price_per_night || 15000,
      available_count: item.available_count || 5,
      beds: item.beds || '1 King Bed',
      bed_type: item.bed_type || 'King',
      facilities: item.facilities || '',
      main_image: item.main_image || '',
      status: item.status || 'active'
    });
    setFormError('');
    setModalMode('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.room_name?.trim()) {
      setFormError('Room name is required.');
      return;
    }
    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        await api('/admin/rooms', { method: 'POST', body: form });
        onNotice('Room added successfully.');
      } else {
        await api(`/admin/rooms/${selectedItem.room_id}`, { method: 'PATCH', body: form });
        onNotice('Room updated successfully.');
      }
      setModalMode(null);
      setRefreshKey(k => k + 1);
    } catch (err) {
      setFormError(err.message || 'Failed to save room details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api(`/admin/rooms/${confirmDelete.room_id}`, { method: 'DELETE' });
      onNotice('Room deleted successfully.');
      setConfirmDelete(null);
      setRefreshKey(k => k + 1);
    } catch (err) {
      onNotice(`Error: ${err.message}`);
    }
  };

  const columns = [
    { key: 'room_id', label: 'ID', width: '60px', sortable: true, rowKey: 'room_id' },
    {
      key: 'room_name',
      label: 'Room Name',
      sortable: true,
      render: (val, row) => (
        <div className="admin-item-text">
          <span className="admin-item-title">{val}</span>
          <span className="admin-item-sub">{row.hotel_name || `Hotel #${row.hotel_id}`}</span>
        </div>
      )
    },
    { key: 'capacity', label: 'Capacity', sortable: true, render: v => `${v} Guests` },
    {
      key: 'price_per_night',
      label: 'Price / Night',
      sortable: true,
      render: v => `LKR ${Number(v || 0).toLocaleString()}`
    },
    { key: 'available_count', label: 'Available', sortable: true, render: v => `${v} units` },
    { key: 'status', label: 'Status', width: '100px', sortable: true, render: v => <AdminBadge value={v} /> },
    {
      key: 'actions',
      label: 'Actions',
      width: '150px',
      align: 'right',
      render: (_, row) => (
        <div className="admin-actions-cell">
          <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => { setSelectedItem(row); setModalMode('view'); }}>
            View
          </button>
          <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => openEdit(row)}>
            Edit
          </button>
          <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" style={{ color: '#dc2626' }} onClick={() => setConfirmDelete(row)}>
            ✕
          </button>
        </div>
      )
    }
  ];

  return (
    <>
      <AdminTable
        columns={columns}
        data={data}
        loading={loading}
        error={error}
        onRefresh={() => setRefreshKey(k => k + 1)}
        searchPlaceholder="Search rooms by name, hotel, facilities…"
        searchFields={['room_name', 'hotel_name', 'description', 'facilities']}
        filterConfigs={[{ key: 'status', label: 'Status', options: ['active', 'inactive'] }]}
        addNewButton={
          <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}>
            + Add Room
          </button>
        }
      />

      <AdminModal
        title={modalMode === 'create' ? 'Add Room' : `Edit: ${selectedItem?.room_name}`}
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        onClose={() => setModalMode(null)}
        size="lg"
        footer={
          <>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setModalMode(null)} disabled={submitting}>Cancel</button>
            <button type="button" className="admin-btn admin-btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Room'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && <div className="admin-notice-banner admin-notice-error">{formError}</div>}
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label>Hotel ID *</label>
              <input required type="number" value={form.hotel_id || 1} onChange={e => setForm({ ...form, hotel_id: Number(e.target.value) })} />
            </div>
            <div className="admin-form-group">
              <label>Room Name *</label>
              <input required placeholder="e.g. Deluxe Ocean View Suite" value={form.room_name || ''} onChange={e => setForm({ ...form, room_name: e.target.value })} />
            </div>
            <div className="admin-form-group">
              <label>Price Per Night (LKR) *</label>
              <input required type="number" value={form.price_per_night || 0} onChange={e => setForm({ ...form, price_per_night: Number(e.target.value) })} />
            </div>
            <div className="admin-form-group">
              <label>Max Guest Capacity</label>
              <input type="number" min={1} value={form.capacity || 2} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} />
            </div>
            <div className="admin-form-group">
              <label>Available Units</label>
              <input type="number" min={0} value={form.available_count || 1} onChange={e => setForm({ ...form, available_count: Number(e.target.value) })} />
            </div>
            <div className="admin-form-group">
              <label>Bed Configuration</label>
              <input placeholder="e.g. 1 King Bed or 2 Single Beds" value={form.beds || ''} onChange={e => setForm({ ...form, beds: e.target.value })} />
            </div>
            <div className="admin-form-group col-span-2">
              <label>Description</label>
              <textarea rows={3} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="admin-form-group col-span-2">
              <label>Room Facilities</label>
              <input placeholder="e.g. Free Wi-Fi, Air Conditioning, Balcony, Safe" value={form.facilities || ''} onChange={e => setForm({ ...form, facilities: e.target.value })} />
            </div>
            <div className="admin-form-group col-span-2">
              <label>Room Image</label>
              <UploadImage kind="rooms" onUploaded={name => setForm({ ...form, main_image: `/uploads/rooms/${name}` })} />
              <input placeholder="Image path or upload above" value={form.main_image || ''} onChange={e => setForm({ ...form, main_image: e.target.value })} style={{ marginTop: '8px' }} />
            </div>
            <div className="admin-form-group">
              <label>Status</label>
              <select value={form.status || 'active'} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </form>
      </AdminModal>

      <AdminDetailModal
        title={selectedItem?.room_name}
        item={selectedItem}
        isOpen={modalMode === 'view'}
        onClose={() => setModalMode(null)}
        actions={<button type="button" className="admin-btn admin-btn-primary" onClick={() => openEdit(selectedItem)}>Edit Room</button>}
        fields={[
          { key: 'room_id', label: 'ID' },
          { key: 'room_name', label: 'Room' },
          { key: 'hotel_name', label: 'Hotel' },
          { key: 'price_per_night', label: 'Price / Night', render: v => `LKR ${Number(v || 0).toLocaleString()}` },
          { key: 'capacity', label: 'Capacity', render: v => `${v} Guests` },
          { key: 'available_count', label: 'Available Count' },
          { key: 'beds', label: 'Beds' },
          { key: 'status', label: 'Status', render: v => <AdminBadge value={v} /> },
          { key: 'description', label: 'Description', fullWidth: true },
          { key: 'facilities', label: 'Facilities', fullWidth: true }
        ]}
      />

      <AdminConfirmModal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Room"
        message={`Delete room "${confirmDelete?.room_name}" permanently?`}
      />
    </>
  );
}

function AdminBookings({ onNotice }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useAsync(() => api('/admin/bookings'), [refreshKey]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [statusModalItem, setStatusModalItem] = useState(null);
  const [newStatus, setNewStatus] = useState('confirmed');
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openStatusModal = (item) => {
    setStatusModalItem(item);
    setNewStatus(item.status || 'confirmed');
    setCancelReason(item.cancel_reason || '');
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api(`/admin/bookings/${statusModalItem.booking_id}`, {
        method: 'PATCH',
        body: {
          status: newStatus,
          cancel_reason: newStatus === 'cancelled' ? cancelReason : null
        }
      });
      onNotice(`Booking ${statusModalItem.booking_ref} status updated to ${newStatus}.`);
      setStatusModalItem(null);
      setRefreshKey(k => k + 1);
    } catch (err) {
      onNotice(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'booking_id', label: 'ID', width: '60px', sortable: true, rowKey: 'booking_id' },
    {
      key: 'booking_ref',
      label: 'Booking Ref',
      sortable: true,
      render: (val, row) => (
        <div className="admin-item-text">
          <span className="admin-item-title" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{val}</span>
          <span className="admin-item-sub">{row.user_name || 'Guest'} ({row.user_email || '—'})</span>
        </div>
      )
    },
    {
      key: 'hotel_name',
      label: 'Stay & Room',
      sortable: true,
      render: (val, row) => (
        <div className="admin-item-text">
          <span className="admin-item-title">{val || `Hotel #${row.hotel_id}`}</span>
          <span className="admin-item-sub">{row.room_name || `Room #${row.room_id}`}</span>
        </div>
      )
    },
    {
      key: 'checkin_date',
      label: 'Dates & Nights',
      sortable: true,
      render: (val, row) => {
        const inDate = val ? String(val).slice(0, 10) : '—';
        const outDate = row.checkout_date ? String(row.checkout_date).slice(0, 10) : '—';
        return <span>{inDate} → {outDate} ({row.nights || 1}N)</span>;
      }
    },
    {
      key: 'total_amount',
      label: 'Total Amount',
      sortable: true,
      render: v => `LKR ${Number(v || 0).toLocaleString()}`
    },
    { key: 'status', label: 'Status', width: '110px', sortable: true, render: v => <AdminBadge value={v} /> },
    {
      key: 'actions',
      label: 'Actions',
      width: '140px',
      align: 'right',
      render: (_, row) => (
        <div className="admin-actions-cell">
          <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setSelectedItem(row)}>
            Details
          </button>
          <button type="button" className="admin-btn admin-btn-lavender admin-btn-sm" onClick={() => openStatusModal(row)}>
            Status
          </button>
        </div>
      )
    }
  ];

  return (
    <>
      <AdminTable
        columns={columns}
        data={data}
        loading={loading}
        error={error}
        onRefresh={() => setRefreshKey(k => k + 1)}
        searchPlaceholder="Search bookings by ref, guest name, hotel, email…"
        searchFields={['booking_ref', 'user_name', 'user_email', 'hotel_name', 'room_name']}
        filterConfigs={[
          { key: 'status', label: 'Status', options: ['pending', 'confirmed', 'completed', 'cancelled'] }
        ]}
        initialSort={{ key: 'booking_id', direction: 'desc' }}
      />

      {/* Booking Details Modal */}
      <AdminDetailModal
        title={`Booking: ${selectedItem?.booking_ref}`}
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        actions={
          <button type="button" className="admin-btn admin-btn-lavender" onClick={() => { setSelectedItem(null); openStatusModal(selectedItem); }}>
            Change Status
          </button>
        }
        fields={[
          { key: 'booking_ref', label: 'Reference' },
          { key: 'status', label: 'Status', render: v => <AdminBadge value={v} /> },
          { key: 'user_name', label: 'Guest Name' },
          { key: 'user_email', label: 'Guest Email' },
          { key: 'hotel_name', label: 'Hotel / Stay' },
          { key: 'room_name', label: 'Room Type' },
          { key: 'checkin_date', label: 'Check-in Date', render: v => v ? String(v).slice(0, 10) : '—' },
          { key: 'checkout_date', label: 'Check-out Date', render: v => v ? String(v).slice(0, 10) : '—' },
          { key: 'nights', label: 'Total Nights' },
          { key: 'guests', label: 'Total Guests' },
          { key: 'rooms_booked', label: 'Rooms Booked' },
          { key: 'price_per_night', label: 'Price / Night', render: v => `LKR ${Number(v || 0).toLocaleString()}` },
          { key: 'total_amount', label: 'Total Price', render: v => `LKR ${Number(v || 0).toLocaleString()}` },
          { key: 'created_at', label: 'Booking Created', render: v => v ? new Date(v).toLocaleString() : '—' },
          { key: 'special_requests', label: 'Special Requests', fullWidth: true },
          { key: 'cancel_reason', label: 'Cancellation Reason', fullWidth: true }
        ]}
      />

      {/* Change Status Modal */}
      <AdminModal
        title={`Update Status: ${statusModalItem?.booking_ref}`}
        isOpen={Boolean(statusModalItem)}
        onClose={() => setStatusModalItem(null)}
        size="sm"
        footer={
          <>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setStatusModalItem(null)} disabled={submitting}>Cancel</button>
            <button type="button" className="admin-btn admin-btn-primary" onClick={handleStatusUpdate} disabled={submitting}>
              {submitting ? 'Updating…' : 'Save Status'}
            </button>
          </>
        }
      >
        <form onSubmit={handleStatusUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="admin-form-group">
            <label>Select New Status</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {newStatus === 'cancelled' && (
            <div className="admin-form-group">
              <label>Reason for Cancellation</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Guest requested cancellation / dates unavailable"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
              />
            </div>
          )}
        </form>
      </AdminModal>
    </>
  );
}

function AdminContacts({ onNotice }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useAsync(() => api('/admin/contacts'), [refreshKey]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const updateStatus = async (item, status) => {
    try {
      await api(`/admin/contacts/${item.contact_id}`, { method: 'PATCH', body: { status } });
      onNotice(`Message marked as ${status}.`);
      if (selectedItem) setSelectedItem({ ...selectedItem, status });
      setRefreshKey(k => k + 1);
    } catch (err) {
      onNotice(`Error: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      await api(`/admin/contacts/${confirmDelete.contact_id}`, { method: 'DELETE' });
      onNotice('Message deleted successfully.');
      setConfirmDelete(null);
      setRefreshKey(k => k + 1);
    } catch (err) {
      onNotice(`Error: ${err.message}`);
    }
  };

  const columns = [
    { key: 'contact_id', label: 'ID', width: '60px', sortable: true, rowKey: 'contact_id' },
    {
      key: 'fullname',
      label: 'Sender',
      sortable: true,
      render: (val, row) => (
        <div className="admin-item-text">
          <span className="admin-item-title">{val}</span>
          <span className="admin-item-sub">{row.email}</span>
        </div>
      )
    },
    {
      key: 'subject',
      label: 'Subject & Snippet',
      render: (val, row) => (
        <div className="admin-item-text">
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{val || 'General Inquiry'}</span>
          <span className="admin-item-sub" style={{ maxWidth: '360px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.message}
          </span>
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Date Received',
      sortable: true,
      render: v => v ? new Date(v).toLocaleDateString() : '—'
    },
    { key: 'status', label: 'Status', width: '110px', sortable: true, render: v => <AdminBadge value={v} /> },
    {
      key: 'actions',
      label: 'Actions',
      width: '140px',
      align: 'right',
      render: (_, row) => (
        <div className="admin-actions-cell">
          <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => { setSelectedItem(row); if (row.status === 'unread') updateStatus(row, 'read'); }}>
            View
          </button>
          <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" style={{ color: '#dc2626' }} onClick={() => setConfirmDelete(row)}>
            ✕
          </button>
        </div>
      )
    }
  ];

  return (
    <>
      <AdminTable
        columns={columns}
        data={data}
        loading={loading}
        error={error}
        onRefresh={() => setRefreshKey(k => k + 1)}
        searchPlaceholder="Search messages by sender, email, subject, text…"
        searchFields={['fullname', 'email', 'subject', 'message']}
        filterConfigs={[{ key: 'status', label: 'Status', options: ['unread', 'read', 'replied'] }]}
        initialSort={{ key: 'contact_id', direction: 'desc' }}
      />

      {/* Message Modal */}
      <AdminModal
        title={`Message from ${selectedItem?.fullname}`}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        size="md"
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-sm"
                onClick={() => updateStatus(selectedItem, selectedItem.status === 'read' ? 'unread' : 'read')}
              >
                Mark {selectedItem?.status === 'read' ? 'Unread' : 'Read'}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary admin-btn-sm"
                onClick={() => updateStatus(selectedItem, 'replied')}
              >
                Mark Replied
              </button>
            </div>
            <a
              className="admin-btn admin-btn-lavender admin-btn-sm"
              href={`mailto:${selectedItem?.email}?subject=Re: ${encodeURIComponent(selectedItem?.subject || 'Explore Lanka Inquiry')}`}
            >
              Reply via Email ↗
            </a>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--line)' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink)' }}>{selectedItem?.fullname}</div>
              <div style={{ fontSize: '0.86rem', color: 'var(--muted)' }}>{selectedItem?.email}</div>
            </div>
            <AdminBadge value={selectedItem?.status} />
          </div>

          <div>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}>Subject</span>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>{selectedItem?.subject}</div>
          </div>

          <div style={{ background: 'var(--paper)', padding: '16px', borderRadius: '10px', border: '1px solid var(--line)', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.92rem' }}>
            {selectedItem?.message}
          </div>
          
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
            Received on: {selectedItem?.created_at ? new Date(selectedItem.created_at).toLocaleString() : '—'}
          </div>
        </div>
      </AdminModal>

      <AdminConfirmModal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Message"
        message={`Delete inquiry from "${confirmDelete?.fullname}" permanently?`}
      />
    </>
  );
}

function AdminReviews({ onNotice }) {
  const [subTab, setSubTab] = useState('destinationReviews'); // 'destinationReviews' | 'reviews'
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useAsync(() => api(`/admin/${subTab}`), [subTab, refreshKey]);
  const [selectedItem, setSelectedItem] = useState(null);

  const updateStatus = async (item, status) => {
    const idKey = subTab === 'destinationReviews' ? 'feedback_id' : 'review_id';
    try {
      await api(`/admin/${subTab}/${item[idKey]}`, { method: 'PATCH', body: { status } });
      onNotice(`Review marked as ${status}.`);
      setRefreshKey(k => k + 1);
    } catch (err) {
      onNotice(`Error: ${err.message}`);
    }
  };

  const columns = subTab === 'destinationReviews' ? [
    { key: 'feedback_id', label: 'ID', width: '60px', sortable: true, rowKey: 'feedback_id' },
    {
      key: 'product_name',
      label: 'Destination',
      sortable: true,
      render: (val, row) => (
        <div className="admin-item-text">
          <span className="admin-item-title">{val || `Destination #${row.product_id}`}</span>
          <span className="admin-item-sub">By: {row.user_name || 'Visitor'}</span>
        </div>
      )
    },
    {
      key: 'rating',
      label: 'Rating',
      sortable: true,
      width: '120px',
      render: v => <AdminRatingStars rating={v} />
    },
    {
      key: 'comment',
      label: 'Comment',
      render: v => <span style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>{v ? (v.length > 75 ? v.slice(0, 75) + '…' : v) : <em>No written comment</em>}</span>
    },
    { key: 'status', label: 'Status', width: '110px', sortable: true, render: v => <AdminBadge value={v} /> },
    {
      key: 'actions',
      label: 'Moderation',
      width: '160px',
      align: 'right',
      render: (_, row) => (
        <div className="admin-actions-cell">
          {row.status !== 'approved' && (
            <button type="button" className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => updateStatus(row, 'approved')} title="Approve Review">
              ✓ Approve
            </button>
          )}
          {row.status !== 'rejected' && (
            <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" style={{ color: '#dc2626' }} onClick={() => updateStatus(row, 'rejected')} title="Reject Review">
              ✕ Reject
            </button>
          )}
        </div>
      )
    }
  ] : [
    { key: 'review_id', label: 'ID', width: '60px', sortable: true, rowKey: 'review_id' },
    {
      key: 'hotel_name',
      label: 'Stay & Reviewer',
      sortable: true,
      render: (val, row) => (
        <div className="admin-item-text">
          <span className="admin-item-title">{val || `Hotel #${row.hotel_id}`}</span>
          <span className="admin-item-sub">{row.user_name || 'Guest'}</span>
        </div>
      )
    },
    {
      key: 'overall_rating',
      label: 'Rating',
      sortable: true,
      width: '120px',
      render: v => <AdminRatingStars rating={v} />
    },
    {
      key: 'title',
      label: 'Title & Comment',
      render: (val, row) => (
        <div className="admin-item-text">
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{val || 'Review'}</span>
          <span className="admin-item-sub" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.comment}
          </span>
        </div>
      )
    },
    { key: 'status', label: 'Status', width: '110px', sortable: true, render: v => <AdminBadge value={v} /> },
    {
      key: 'actions',
      label: 'Moderation',
      width: '160px',
      align: 'right',
      render: (_, row) => (
        <div className="admin-actions-cell">
          {row.status !== 'approved' && (
            <button type="button" className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => updateStatus(row, 'approved')} title="Approve Review">
              ✓ Approve
            </button>
          )}
          {row.status !== 'rejected' && (
            <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" style={{ color: '#dc2626' }} onClick={() => updateStatus(row, 'rejected')} title="Reject Review">
              ✕ Reject
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="admin-subtabs">
        <button
          type="button"
          className={`admin-subtab-btn ${subTab === 'destinationReviews' ? 'active' : ''}`}
          onClick={() => setSubTab('destinationReviews')}
        >
          📍 Destination Reviews
        </button>
        <button
          type="button"
          className={`admin-subtab-btn ${subTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setSubTab('reviews')}
        >
          🏨 Hotel & Stay Reviews
        </button>
      </div>

      <AdminTable
        columns={columns}
        data={data}
        loading={loading}
        error={error}
        onRefresh={() => setRefreshKey(k => k + 1)}
        searchPlaceholder="Search reviews by target, reviewer name, comment text…"
        searchFields={subTab === 'destinationReviews' ? ['product_name', 'user_name', 'comment'] : ['hotel_name', 'user_name', 'title', 'comment']}
        filterConfigs={[{ key: 'status', label: 'Status', options: ['pending', 'approved', 'rejected'] }]}
        initialSort={{ key: subTab === 'destinationReviews' ? 'feedback_id' : 'review_id', direction: 'desc' }}
      />
    </div>
  );
}

function AdminUsers({ onNotice, currentUser }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useAsync(() => api('/admin/users'), [refreshKey]);
  const [modalMode, setModalMode] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setForm({
      fullname: '',
      email: '',
      password: '',
      phone: '',
      role: 'user',
      status: 'active'
    });
    setFormError('');
    setModalMode('create');
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    setForm({
      fullname: item.fullname || '',
      email: item.email || '',
      password: '', // blank unless resetting
      phone: item.phone || '',
      role: item.role || 'user',
      status: item.status || 'active'
    });
    setFormError('');
    setModalMode('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.fullname?.trim() || !form.email?.trim()) {
      setFormError('Name and email are required.');
      return;
    }
    if (modalMode === 'create' && (!form.password || form.password.length < 8)) {
      setFormError('New users require a password with at least 8 characters.');
      return;
    }
    if (modalMode === 'edit' && form.password && form.password.length < 8) {
      setFormError('New password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        await api('/admin/users', { method: 'POST', body: form });
        onNotice('User account created successfully.');
      } else {
        const payload = {
          fullname: form.fullname,
          phone: form.phone,
          role: form.role,
          status: form.status
        };
        if (form.password) payload.password = form.password;
        await api(`/admin/users/${selectedItem.user_id}`, { method: 'PATCH', body: payload });
        onNotice('User account updated successfully.');
      }
      setModalMode(null);
      setRefreshKey(k => k + 1);
    } catch (err) {
      setFormError(err.message || 'Failed to save user.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'user_id', label: 'ID', width: '60px', sortable: true, rowKey: 'user_id' },
    {
      key: 'fullname',
      label: 'User Details',
      sortable: true,
      render: (val, row) => (
        <div className="admin-table-item-cell">
          <div className="admin-avatar">
            {val ? val.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
          </div>
          <div className="admin-item-text">
            <span className="admin-item-title">
              {val} {currentUser?.user_id === row.user_id && <small style={{ color: 'var(--lavender)', fontWeight: 700 }}>(You)</small>}
            </span>
            <span className="admin-item-sub">{row.email} · {row.phone || 'No phone'}</span>
          </div>
        </div>
      )
    },
    { key: 'role', label: 'Role', width: '110px', sortable: true, render: v => <AdminBadge value={v} /> },
    { key: 'status', label: 'Status', width: '110px', sortable: true, render: v => <AdminBadge value={v} /> },
    {
      key: 'actions',
      label: 'Actions',
      width: '140px',
      align: 'right',
      render: (_, row) => (
        <div className="admin-actions-cell">
          <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => { setSelectedItem(row); setModalMode('view'); }}>
            View
          </button>
          <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => openEdit(row)}>
            Edit
          </button>
        </div>
      )
    }
  ];

  return (
    <>
      <AdminTable
        columns={columns}
        data={data}
        loading={loading}
        error={error}
        onRefresh={() => setRefreshKey(k => k + 1)}
        searchPlaceholder="Search users by name, email, phone, role…"
        searchFields={['fullname', 'email', 'phone', 'role']}
        filterConfigs={[
          { key: 'role', label: 'Role', options: ['admin', 'user'] },
          { key: 'status', label: 'Status', options: ['active', 'inactive'] }
        ]}
        initialSort={{ key: 'user_id', direction: 'asc' }}
        addNewButton={
          <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}>
            + Add User
          </button>
        }
      />

      {/* User Create / Edit Modal */}
      <AdminModal
        title={modalMode === 'create' ? 'Create User Account' : `Edit User: ${selectedItem?.fullname}`}
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        onClose={() => setModalMode(null)}
        footer={
          <>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setModalMode(null)} disabled={submitting}>Cancel</button>
            <button type="button" className="admin-btn admin-btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving…' : 'Save User'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && <div className="admin-notice-banner admin-notice-error">{formError}</div>}
          <div className="admin-form-grid">
            <div className="admin-form-group col-span-2">
              <label>Full Name *</label>
              <input required value={form.fullname || ''} onChange={e => setForm({ ...form, fullname: e.target.value })} />
            </div>

            <div className="admin-form-group">
              <label>Email Address *</label>
              <input
                required
                type="email"
                readOnly={modalMode === 'edit'}
                style={modalMode === 'edit' ? { opacity: 0.75, cursor: 'not-allowed' } : {}}
                value={form.email || ''}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="admin-form-group">
              <label>Phone Number</label>
              <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>

            <div className="admin-form-group">
              <label>Account Role *</label>
              <select value={form.role || 'user'} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="user">User (Standard Traveler)</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label>Account Status *</label>
              <select value={form.status || 'active'} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive (Deactivated)</option>
              </select>
            </div>

            <div className="admin-form-group col-span-2">
              <label>{modalMode === 'create' ? 'Initial Password *' : 'Reset Password (optional)'}</label>
              <input
                type="password"
                minLength={8}
                placeholder={modalMode === 'create' ? 'Minimum 8 characters' : 'Leave blank to keep existing password'}
                value={form.password || ''}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
              <span className="admin-form-hint">Passwords are securely hashed using bcrypt.</span>
            </div>
          </div>
        </form>
      </AdminModal>

      {/* User Details Modal */}
      <AdminDetailModal
        title={selectedItem?.fullname}
        item={selectedItem}
        isOpen={modalMode === 'view'}
        onClose={() => setModalMode(null)}
        actions={<button type="button" className="admin-btn admin-btn-primary" onClick={() => openEdit(selectedItem)}>Edit User</button>}
        fields={[
          { key: 'user_id', label: 'User ID' },
          { key: 'fullname', label: 'Full Name' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
          { key: 'role', label: 'Role', render: v => <AdminBadge value={v} /> },
          { key: 'status', label: 'Status', render: v => <AdminBadge value={v} /> }
        ]}
      />
    </>
  );
}

const ADMIN_SECTIONS = [
  { id: 'overview', label: 'Overview', icon: '📊', group: 'MAIN', description: 'System summary, key metrics and recent activity' },
  { id: 'places', label: 'Destinations', icon: '📍', group: 'CONTENT & CATALOG', description: 'Manage tourist spots, citadels, and attractions' },
  { id: 'features', label: 'Experiences', icon: '✦', group: 'CONTENT & CATALOG', description: 'Manage travel experiences, guides, and highlights' },
  { id: 'hotels', label: 'Stays & Hotels', icon: '🏨', group: 'CONTENT & CATALOG', description: 'Accommodations, resorts, guest houses, and SLTDA dataset' },
  { id: 'rooms', label: 'Rooms', icon: '🚪', group: 'CONTENT & CATALOG', description: 'Manage hotel room categories, capacity, and rates' },
  { id: 'bookings', label: 'Bookings', icon: '📋', group: 'OPERATIONS', description: 'Guest reservations, dates, check-ins, and statuses' },
  { id: 'contacts', label: 'Guest Messages', icon: '✉️', group: 'OPERATIONS', description: 'Visitor contact inquiries, questions, and responses' },
  { id: 'reviews', label: 'Reviews', icon: '⭐', group: 'COMMUNITY', description: 'Moderate destination feedback and hotel visitor reviews' },
  { id: 'users', label: 'Users & Staff', icon: '👥', group: 'SYSTEM', description: 'User accounts, permissions, and administrative access' }
];

function Admin() {
  const [section, setSection] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const summary = useAsync(() => api('/admin/summary'), [refreshKey]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user, setUser } = useContext(AuthContext);
  const nav = useNavigate();
  const [notice, setNotice] = useState('');

  const currentSectionMeta = ADMIN_SECTIONS.find(s => s.id === section) || ADMIN_SECTIONS[0];

  const handleNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4500);
  };

  const handleLogout = async () => {
    await api('/auth/logout', { method: 'POST' });
    setUser(null);
    nav('/login');
  };

  const navGroups = useMemo(() => {
    const groups = {};
    ADMIN_SECTIONS.forEach(s => {
      if (!groups[s.group]) groups[s.group] = [];
      groups[s.group].push(s);
    });
    return groups;
  }, []);

  return (
    <main className="admin-shell">
      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          <Link to="/admin" className="admin-sidebar-brand" onClick={() => setSection('overview')}>
            <div className="admin-brand-icon">✳</div>
            {!sidebarCollapsed && (
              <div className="admin-brand-text">
                <strong>Explore Lanka</strong>
                <small>Admin Panel</small>
              </div>
            )}
          </Link>
          <button
            type="button"
            className="admin-sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {Object.entries(navGroups).map(([groupTitle, items]) => (
            <div key={groupTitle} className="admin-nav-group">
              <div className="admin-nav-group-title">{groupTitle}</div>
              {items.map(item => {
                const isActive = section === item.id;
                let badgeCount = null;
                let badgeVariant = 'badge-lavender';
                if (item.id === 'contacts' && summary.data?.unreadMessages > 0) {
                  badgeCount = summary.data.unreadMessages;
                  badgeVariant = 'badge-sky';
                }
                if (item.id === 'reviews' && summary.data?.pendingReviews > 0) {
                  badgeCount = summary.data.pendingReviews;
                  badgeVariant = 'badge-lavender';
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`admin-nav-button ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setSection(item.id);
                      setMobileSidebarOpen(false);
                    }}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <span className="admin-nav-icon">{item.icon}</span>
                    <span className="admin-nav-label">{item.label}</span>
                    {badgeCount !== null && (
                      <span className={`admin-nav-badge ${badgeVariant}`}>{badgeCount}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-profile">
            <div className="admin-avatar">
              {user?.fullname ? user.fullname.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'A'}
            </div>
            <div className="admin-user-details">
              <span>{user?.fullname || 'Administrator'}</span>
              <small>admin@explorelanka.lk</small>
            </div>
          </div>
          <div className="admin-footer-actions">
            <Link to="/" className="admin-footer-link" title="View Public Website">
              <span>Public Site</span> ↗
            </Link>
            <button type="button" className="admin-footer-link" onClick={handleLogout} title="Sign Out">
              <span>Sign Out</span> ⇥
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="admin-main">
        {/* Header Topbar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-mobile-toggle"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              aria-label="Toggle Navigation"
            >
              ☰
            </button>
            <nav className="admin-breadcrumbs" aria-label="Breadcrumbs">
              <Link to="/admin" onClick={() => setSection('overview')}>Admin</Link>
              <span className="sep">/</span>
              <span className="current">{currentSectionMeta.label}</span>
            </nav>
          </div>

          <div className="admin-topbar-right">
            {summary.data?.pendingReviews > 0 && (
              <button
                type="button"
                className="admin-topbar-pill pill-review"
                onClick={() => setSection('reviews')}
              >
                ⭐ {summary.data.pendingReviews} Pending Review{summary.data.pendingReviews > 1 ? 's' : ''}
              </button>
            )}
            {summary.data?.unreadMessages > 0 && (
              <button
                type="button"
                className="admin-topbar-pill pill-inquiry"
                onClick={() => setSection('contacts')}
              >
                ✉️ {summary.data.unreadMessages} New Message{summary.data.unreadMessages > 1 ? 's' : ''}
              </button>
            )}
          </div>
        </header>

        {/* Content View */}
        <div className="admin-content">
          <div className="admin-page-header">
            <div className="admin-page-title-group">
              <h1>{currentSectionMeta.label}</h1>
              <p>{currentSectionMeta.description}</p>
            </div>
          </div>

          {notice && (
            <div className="admin-notice-banner admin-notice-success">
              ✓ {notice}
            </div>
          )}

          {section === 'overview' && (
            <AdminOverview
              summary={summary}
              setSection={setSection}
              onRefresh={() => setRefreshKey(k => k + 1)}
            />
          )}
          {section === 'places' && <AdminPlaces onNotice={handleNotice} />}
          {section === 'features' && <AdminFeatures onNotice={handleNotice} />}
          {section === 'hotels' && <AdminHotels onNotice={handleNotice} />}
          {section === 'rooms' && <AdminRooms onNotice={handleNotice} />}
          {section === 'bookings' && <AdminBookings onNotice={handleNotice} />}
          {section === 'contacts' && <AdminContacts onNotice={handleNotice} />}
          {section === 'reviews' && <AdminReviews onNotice={handleNotice} />}
          {section === 'users' && <AdminUsers onNotice={handleNotice} currentUser={user} />}
        </div>
      </div>
    </main>
  );
}
function NotFound() { return <main className="page-state"><p className="eyebrow eyebrow-dark">404 · Not found</p><h1>Looks like this path went wandering.</h1><Link className="button button-green" to="/">Back to the home page</Link></main>; }

export default App;
