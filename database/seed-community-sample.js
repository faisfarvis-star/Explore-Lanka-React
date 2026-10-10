import mysql from 'mysql2/promise';
import { getDbConfig } from './db-config.js';

const pool = mysql.createPool(getDbConfig());

try {
  const [[cnt]] = await pool.query('SELECT COUNT(*) AS n FROM community_posts');
  if (cnt.n === 0) {
    // Update sample users with bios and locations
    await pool.query(`
      UPDATE users SET 
        bio = 'Photographer and passionate island explorer. Always hunting for the golden hour in Sri Lanka.',
        city = 'Kandy',
        country = 'Sri Lanka'
      WHERE user_id = 3;
    `);

    await pool.query(`
      UPDATE users SET 
        bio = 'Train enthusiast, hiker, and tea lover based in Colombo. Exploring every province one weekend at a time.',
        city = 'Colombo',
        country = 'Sri Lanka'
      WHERE user_id = 4;
    `);

    await pool.query(`
      UPDATE users SET 
        bio = 'Coastal wanderer and heritage buff. Finding quiet beaches and ancient ruins.',
        city = 'Galle',
        country = 'Sri Lanka'
      WHERE user_id = 5;
    `);

    await pool.query(`
      UPDATE users SET 
        bio = 'Official guide and curator for Explore Lanka. Welcoming curious travelers to our island home.',
        city = 'Colombo',
        country = 'Sri Lanka'
      WHERE user_id = 1;
    `);

    // Insert sample posts
    await pool.query(`
      INSERT INTO community_posts (user_id, content, destination_tag, image_url, created_at) VALUES
      (3, 'Caught the morning sunrise at the top of Sigiriya today! The view over the mist-covered Central Province was breathtaking. Make sure to start climbing by 6:30 AM to beat the midday heat.', 'Sigiriya', '/Tourist_Images/Sigiriya/1.%20Sigiriya%20Rock%20Fortress.jpg', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
      (4, 'The blue train ride from Kandy to Ella through the tea plantations is everything they say and more. Sipping fresh Ceylon tea while passing waterfalls at 5,000 feet!', 'Ella', '/Tourist_Images/Ella%20Rock/Ella%20Rock2.jpg', DATE_SUB(NOW(), INTERVAL 5 HOUR)),
      (5, 'Spent a golden afternoon walking along the ramparts of Galle Fort. The Dutch colonial architecture and the sunset over the lighthouse were pure magic.', 'Galle Fort', '/Tourist_Images/Galle%20Fort/Galle%20Fort1.jpg', DATE_SUB(NOW(), INTERVAL 1 DAY)),
      (6, 'Early morning walk to Nine Arch Bridge in Demodara. Managed to see the 9:15 AM train crossing right on time. Highly recommend grabbing a coconut from the stalls nearby.', 'Nine Arch Bridge', '/Tourist_Images/Nine%20Arches%20Bridge/Nine%20Arches%20Bridge%201.jpg', DATE_SUB(NOW(), INTERVAL 2 DAY));
    `);
    
    // Insert sample likes & comments
    await pool.query(`
      INSERT INTO community_likes (post_id, user_id) VALUES
      (1, 1), (1, 4), (1, 5),
      (2, 1), (2, 3),
      (3, 3), (3, 4), (3, 6),
      (4, 1), (4, 3), (4, 5);
    `);

    await pool.query(`
      INSERT INTO community_comments (post_id, user_id, content, created_at) VALUES
      (1, 1, 'Incredible photo! Did you take the water garden route on the way down?', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
      (1, 4, 'Totally agree about the 6:30 AM start. So much quieter too.', DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
      (2, 5, 'Which carriage did you book? Looking to take the train next month!', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
      (3, 3, 'Galle Fort sunsets are truly unforgettable. Hope you tried the gelato near Pedlar Street!', DATE_SUB(NOW(), INTERVAL 18 HOUR));
    `);
    
    console.log('Sample community posts, likes, comments, and member bios seeded successfully.');
  } else {
    console.log('Community posts already present:', cnt.n);
  }
  await pool.end();
} catch (e) {
  console.error('Seed error:', e.message);
  process.exit(1);
}
