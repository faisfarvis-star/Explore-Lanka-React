-- ============================================================
-- FIX: Add missing columns and tables
-- Run this in phpMyAdmin or MySQL CLI against explore_lanka_db
-- ============================================================

USE explore_lanka_db;

-- 1. Add missing columns to the features table
ALTER TABLE features
    ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive') NOT NULL DEFAULT 'active' AFTER image,
    ADD COLUMN IF NOT EXISTS slug VARCHAR(150) DEFAULT NULL AFTER features_name,
    ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT NULL AFTER description;

-- 2. Update existing features with slugs based on their names
UPDATE features SET slug = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(features_name, ' ', '-'), '&', 'and'), "'", ''), '.', '')) WHERE slug IS NULL;

-- 3. Create product_feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT DEFAULT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Safely ensure comment column exists on existing product_feedback table
DROP PROCEDURE IF EXISTS fix_product_feedback_comment;
DELIMITER //
CREATE PROCEDURE fix_product_feedback_comment()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'product_feedback' 
          AND COLUMN_NAME = 'comment'
    ) THEN
        ALTER TABLE product_feedback ADD COLUMN comment TEXT DEFAULT NULL AFTER rating;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'product_feedback' 
          AND COLUMN_NAME = 'message'
    ) THEN
        UPDATE product_feedback SET comment = message WHERE comment IS NULL AND message IS NOT NULL;
    END IF;
END //
DELIMITER ;
CALL fix_product_feedback_comment();
DROP PROCEDURE IF EXISTS fix_product_feedback_comment;

