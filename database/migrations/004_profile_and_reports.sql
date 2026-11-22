-- ใช้เฉพาะกรณีที่ "เคยรัน 01_schema_users.sql เวอร์ชันเก่าไปแล้ว" (users ยังไม่มี gender/height_cm/weight_kg)
USE kitgle_users;

ALTER TABLE users
  ADD COLUMN gender ENUM('male','female','other') NULL AFTER birth_date,
  ADD COLUMN height_cm SMALLINT UNSIGNED NULL AFTER gender,
  ADD COLUMN weight_kg DECIMAL(5,1) NULL AFTER height_cm;

CREATE TABLE IF NOT EXISTS app_reports (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_report_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
