import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { getDbConfig } from './db-config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pool = mysql.createPool(getDbConfig());

const sql = readFileSync(
  path.join(__dirname, 'migrations', '004_community_media_social.sql'),
  'utf8'
);

const conn = await pool.getConnection();
try {
  const stmts = sql
    .replace(/--[^\n]*/g, '')
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const stmt of stmts) {
    if (stmt.toUpperCase().startsWith('DELIMITER') || stmt.toUpperCase().startsWith('USE ')) continue;
    try {
      await conn.query(stmt);
      console.log('OK:', stmt.slice(0, 80).replace(/\s+/g, ' '));
    } catch (e) {
      if (e.code === 'ER_TABLE_EXISTS_ERROR' || e.message.includes('already exists')) {
        console.log('SKIP (already exists):', stmt.slice(0, 60));
      } else if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('SKIP (column exists):', stmt.slice(0, 60));
      } else {
        console.error('ERR:', e.message, '\n  SQL:', stmt.slice(0, 120));
      }
    }
  }
  console.log('\n✓ Migration 004 complete.');
} finally {
  conn.release();
  await pool.end();
}
