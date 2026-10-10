import mysql from 'mysql2/promise';
import { getDbConfig } from './db-config.js';

const pool = mysql.createPool(getDbConfig());

try {
  console.log('Running Migration 003: Community Posts, Likes, and Comments...');
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS community_posts (
      post_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      content TEXT NOT NULL,
      image_url VARCHAR(255) DEFAULT NULL,
      destination_tag VARCHAR(100) DEFAULT NULL,
      status ENUM('active', 'hidden', 'deleted') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_posts (user_id),
      INDEX idx_status_created (status, created_at),
      INDEX idx_dest_tag (destination_tag)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS community_likes (
      like_id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_post_user_like (post_id, user_id),
      INDEX idx_like_post (post_id),
      INDEX idx_like_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS community_comments (
      comment_id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT NOT NULL,
      content TEXT NOT NULL,
      status ENUM('active', 'hidden', 'deleted') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_comment_post (post_id, created_at),
      INDEX idx_comment_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  const [tables] = await pool.query('SHOW TABLES');
  console.log('Migration 003 completed successfully. Tables:', tables.map(t => Object.values(t)[0]));
  await pool.end();
} catch (e) {
  console.error('Migration error:', e.message);
  process.exit(1);
}
