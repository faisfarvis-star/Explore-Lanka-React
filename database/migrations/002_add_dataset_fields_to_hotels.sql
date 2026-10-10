-- ============================================================
-- Migration 002: Add dataset-import fields to hotels table
-- Safe to run multiple times (uses IF NOT EXISTS checks via
-- INFORMATION_SCHEMA so it works on MySQL 5.7 / 8.x).
-- Run AFTER hotel_system.sql.
-- ============================================================

USE explore_lanka_db;

-- 1. accommodation_type  (e.g. Guest House, Bungalow, Hotel, Hostel …)
SET @col = 'accommodation_type';
SET @tbl = 'hotels';
SET @db  = DATABASE();
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA=@db AND TABLE_NAME=@tbl AND COLUMN_NAME=@col) = 0,
  CONCAT('ALTER TABLE `',@tbl,'` ADD COLUMN `',@col,'` VARCHAR(80) DEFAULT NULL AFTER `district`'),
  'SELECT "column accommodation_type already exists" AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. grade  (A/B/C or SUPERIOR / STANDARD …)
SET @col = 'grade';
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA=@db AND TABLE_NAME=@tbl AND COLUMN_NAME=@col) = 0,
  CONCAT('ALTER TABLE `',@tbl,'` ADD COLUMN `',@col,'` VARCHAR(50) DEFAULT NULL AFTER `star_category`'),
  'SELECT "column grade already exists" AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. registration_number  (SLTDA reg, used as dedup key)
SET @col = 'registration_number';
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA=@db AND TABLE_NAME=@tbl AND COLUMN_NAME=@col) = 0,
  CONCAT('ALTER TABLE `',@tbl,'` ADD COLUMN `',@col,'` VARCHAR(100) DEFAULT NULL AFTER `grade`'),
  'SELECT "column registration_number already exists" AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. licence_status  (e.g. "Valid till 31st December 2026" / "Expired …")
SET @col = 'licence_status';
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA=@db AND TABLE_NAME=@tbl AND COLUMN_NAME=@col) = 0,
  CONCAT('ALTER TABLE `',@tbl,'` ADD COLUMN `',@col,'` VARCHAR(100) DEFAULT NULL AFTER `registration_number`'),
  'SELECT "column licence_status already exists" AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5. record_status  (short label: "official" / "historical" / "travel-site")
SET @col = 'record_status';
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA=@db AND TABLE_NAME=@tbl AND COLUMN_NAME=@col) = 0,
  CONCAT('ALTER TABLE `',@tbl,'` ADD COLUMN `',@col,'` VARCHAR(30) DEFAULT NULL AFTER `licence_status`'),
  'SELECT "column record_status already exists" AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 6. booking_link
SET @col = 'booking_link';
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA=@db AND TABLE_NAME=@tbl AND COLUMN_NAME=@col) = 0,
  CONCAT('ALTER TABLE `',@tbl,'` ADD COLUMN `',@col,'` VARCHAR(500) DEFAULT NULL AFTER `website`'),
  'SELECT "column booking_link already exists" AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 7. mobile  (secondary phone from dataset)
SET @col = 'mobile';
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA=@db AND TABLE_NAME=@tbl AND COLUMN_NAME=@col) = 0,
  CONCAT('ALTER TABLE `',@tbl,'` ADD COLUMN `',@col,'` VARCHAR(30) DEFAULT NULL AFTER `phone`'),
  'SELECT "column mobile already exists" AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 8. dataset_source  ('manual' for hand-entered, 'sltda_import' for this dataset)
SET @col = 'dataset_source';
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA=@db AND TABLE_NAME=@tbl AND COLUMN_NAME=@col) = 0,
  CONCAT('ALTER TABLE `',@tbl,'` ADD COLUMN `',@col,'` VARCHAR(30) DEFAULT ''manual'' AFTER `created_by`'),
  'SELECT "column dataset_source already exists" AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index on registration_number for fast dedup
SET @idx = 'idx_reg_num';
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA=@db AND TABLE_NAME=@tbl AND INDEX_NAME=@idx) = 0,
  CONCAT('ALTER TABLE `',@tbl,'` ADD INDEX `',@idx,'` (registration_number)'),
  'SELECT "index idx_reg_num already exists" AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'Migration 002 complete.' AS result;
