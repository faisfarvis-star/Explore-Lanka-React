-- ============================================================
-- MIGRATION: 003_community_posts_comments_likes.sql
-- Project: Explore Lanka
-- Purpose: Adds community social features (posts, comments, likes)
--          and ensures user profile fields (bio, profile_image) exist
-- Compatibility: MySQL 5.7+, MySQL 8.0+, MariaDB 10.x+
-- Safe to execute multiple times (idempotent).
-- ============================================================

-- USE `explore_lanka_db`;

-- 1. Create community_posts table
CREATE TABLE IF NOT EXISTS `community_posts` (
    `post_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `content` TEXT NOT NULL,
    `image_url` VARCHAR(255) DEFAULT NULL,
    `destination_tag` VARCHAR(100) DEFAULT NULL,
    `status` ENUM('active', 'hidden', 'deleted') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user_posts` (`user_id`),
    INDEX `idx_status_created` (`status`, `created_at`),
    INDEX `idx_dest_tag` (`destination_tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create community_likes table
CREATE TABLE IF NOT EXISTS `community_likes` (
    `like_id` INT AUTO_INCREMENT PRIMARY KEY,
    `post_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_post_user_like` (`post_id`, `user_id`),
    INDEX `idx_like_post` (`post_id`),
    INDEX `idx_like_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create community_comments table
CREATE TABLE IF NOT EXISTS `community_comments` (
    `comment_id` INT AUTO_INCREMENT PRIMARY KEY,
    `post_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `content` TEXT NOT NULL,
    `status` ENUM('active', 'hidden', 'deleted') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_comment_post` (`post_id`, `created_at`),
    INDEX `idx_comment_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Ensure `users` table has bio and profile_image columns
DROP PROCEDURE IF EXISTS `migrate_community_user_columns`;

DELIMITER //

CREATE PROCEDURE `migrate_community_user_columns`()
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'users' 
          AND COLUMN_NAME = 'bio'
    ) THEN
        ALTER TABLE `users` ADD COLUMN `bio` TEXT DEFAULT NULL AFTER `phone`;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'users' 
          AND COLUMN_NAME = 'profile_image'
    ) THEN
        ALTER TABLE `users` ADD COLUMN `profile_image` VARCHAR(255) DEFAULT NULL AFTER `bio`;
    END IF;
END //

DELIMITER ;

CALL `migrate_community_user_columns`();
DROP PROCEDURE IF EXISTS `migrate_community_user_columns`;
