-- ============================================================
-- MIGRATION: 001_add_product_feedback_comment.sql
-- Project: Explore Lanka
-- Purpose: Safely adds the `comment` column to `product_feedback`
--          without deleting, dropping, or resetting any data.
-- Compatibility: MySQL 5.7+, MySQL 8.0+, MariaDB 10.x+
-- Safe to execute multiple times (idempotent).
-- ============================================================

-- USE `explore_lanka_db`;

-- 1. Ensure product_feedback table exists
CREATE TABLE IF NOT EXISTS `product_feedback` (
    `feedback_id` INT AUTO_INCREMENT PRIMARY KEY,
    `product_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `rating` INT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
    `comment` TEXT DEFAULT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_product` (`product_id`),
    INDEX `idx_user` (`user_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Safely add missing `comment` column and migrate any legacy `message` data
DROP PROCEDURE IF EXISTS `migrate_add_product_feedback_comment`;

DELIMITER //

CREATE PROCEDURE `migrate_add_product_feedback_comment`()
BEGIN
    -- Add comment column if not already present
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'product_feedback' 
          AND COLUMN_NAME = 'comment'
    ) THEN
        ALTER TABLE `product_feedback` ADD COLUMN `comment` TEXT DEFAULT NULL AFTER `rating`;
    END IF;

    -- If legacy `message` column exists, migrate existing review text into `comment`
    IF EXISTS (
        SELECT 1 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'product_feedback' 
          AND COLUMN_NAME = 'message'
    ) THEN
        UPDATE `product_feedback` 
        SET `comment` = `message` 
        WHERE `comment` IS NULL AND `message` IS NOT NULL;
    END IF;
END //

DELIMITER ;

CALL `migrate_add_product_feedback_comment`();

DROP PROCEDURE IF EXISTS `migrate_add_product_feedback_comment`;
