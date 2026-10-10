import mysql from 'mysql2/promise';
import { getDbConfig } from './db-config.js';

const pool = mysql.createPool(getDbConfig());

const queries = [
  `ALTER TABLE community_posts ADD COLUMN media_type ENUM('none','photos','video') NOT NULL DEFAULT 'none' AFTER image_url`
];

try {
  const conn = await pool.getConnection();
  for (const q of queries) {
    try {
      await conn.query(q);
      console.log('OK:', q.slice(0, 80));
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('SKIP (already exists):', q.slice(0, 60));
      else console.error('ERR:', e.message);
    }
  }
  conn.release();
} catch (err) {
  console.error('Connection error:', err.message);
} finally {
  await pool.end();
  console.log('Done.');
}
