-- ============================================================
-- MIGRATION: 004_community_media_social.sql
-- Project: Explore Lanka
-- Purpose: Multi-photo/video attachments, follow/friend system,
--          private messaging, and block/report controls
-- Compatibility: MySQL 5.7+, MySQL 8.0+, MariaDB 10.x+
-- Safe to execute multiple times (idempotent).
-- ============================================================

-- USE `explore_lanka_db`;

-- 1. Add media_type column to community_posts for video support
DROP PROCEDURE IF EXISTS `migrate_004_posts_media_type`;
DELIMITER //
CREATE PROCEDURE `migrate_004_posts_media_type`()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'community_posts'
          AND COLUMN_NAME = 'media_type'
    ) THEN
        ALTER TABLE `community_posts`
            ADD COLUMN `media_type` ENUM('none','photos','video') NOT NULL DEFAULT 'none' AFTER `image_url`;
    END IF;
END //
DELIMITER ;
CALL `migrate_004_posts_media_type`();
DROP PROCEDURE IF EXISTS `migrate_004_posts_media_type`;

-- 2. Post attachments table (up to 10 photos OR 1 video per post)
CREATE TABLE IF NOT EXISTS `community_post_media` (
    `media_id`   INT AUTO_INCREMENT PRIMARY KEY,
    `post_id`    INT NOT NULL,
    `url`        VARCHAR(400) NOT NULL,
    `kind`       ENUM('photo','video') NOT NULL DEFAULT 'photo',
    `sort_order` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_media_post` (`post_id`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Follow / Unfollow
CREATE TABLE IF NOT EXISTS `community_follows` (
    `follow_id`   INT AUTO_INCREMENT PRIMARY KEY,
    `follower_id` INT NOT NULL,
    `followee_id` INT NOT NULL,
    `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_follow` (`follower_id`, `followee_id`),
    INDEX `idx_follower`  (`follower_id`),
    INDEX `idx_followee`  (`followee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Friend Requests (pending → accepted | declined)
CREATE TABLE IF NOT EXISTS `community_friend_requests` (
    `request_id`  INT AUTO_INCREMENT PRIMARY KEY,
    `sender_id`   INT NOT NULL,
    `receiver_id` INT NOT NULL,
    `status`      ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
    `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_friend_pair` (`sender_id`, `receiver_id`),
    INDEX `idx_fr_receiver` (`receiver_id`, `status`),
    INDEX `idx_fr_sender`   (`sender_id`,   `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Blocks (blocked user cannot follow, request friend, or message)
CREATE TABLE IF NOT EXISTS `community_blocks` (
    `block_id`   INT AUTO_INCREMENT PRIMARY KEY,
    `blocker_id` INT NOT NULL,
    `blocked_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_block` (`blocker_id`, `blocked_id`),
    INDEX `idx_block_blocker` (`blocker_id`),
    INDEX `idx_block_blocked` (`blocked_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Reports (for content moderation)
CREATE TABLE IF NOT EXISTS `community_reports` (
    `report_id`    INT AUTO_INCREMENT PRIMARY KEY,
    `reporter_id`  INT NOT NULL,
    `target_type`  ENUM('post','comment','user') NOT NULL,
    `target_id`    INT NOT NULL,
    `reason`       VARCHAR(200) NOT NULL DEFAULT 'inappropriate',
    `notes`        TEXT,
    `status`       ENUM('pending','reviewed','dismissed') NOT NULL DEFAULT 'pending',
    `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_report` (`reporter_id`, `target_type`, `target_id`),
    INDEX `idx_report_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Private Messages (friends only)
CREATE TABLE IF NOT EXISTS `community_messages` (
    `message_id`   INT AUTO_INCREMENT PRIMARY KEY,
    `sender_id`    INT NOT NULL,
    `receiver_id`  INT NOT NULL,
    `content`      TEXT NOT NULL,
    `is_read`      TINYINT(1) NOT NULL DEFAULT 0,
    `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_msg_sender`      (`sender_id`),
    INDEX `idx_msg_receiver`    (`receiver_id`),
    INDEX `idx_msg_conversation` (`sender_id`, `receiver_id`, `created_at`),
    INDEX `idx_msg_unread`      (`receiver_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
