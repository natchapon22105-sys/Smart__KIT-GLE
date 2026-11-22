-- ฐานข้อมูลที่ 1: ข้อมูลผู้ใช้งาน (kitgle_users)
-- รันใน MySQL Workbench: เลือก connection → เปิดไฟล์ → Execute
CREATE DATABASE IF NOT EXISTS kitgle_users CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kitgle_users;

CREATE TABLE IF NOT EXISTS users (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  username      VARCHAR(30)  NOT NULL UNIQUE,      -- ชื่อผู้ใช้ (a-z 0-9 _ .) ใช้ล็อกอินแทนอีเมลได้
  password_hash VARCHAR(255) NOT NULL,
  display_name  VARCHAR(120) NOT NULL,
  birth_date    DATE NULL,
  gender        ENUM('male','female','other') NULL,
  height_cm     SMALLINT UNSIGNED NULL,
  weight_kg     DECIMAL(5,1) NULL,
  avatar_data   MEDIUMTEXT NULL,                   -- รูปโปรไฟล์ (data URI ขนาดเล็ก) TODO: ย้ายไป object storage ตอน production
  privacy_accepted_at DATETIME NOT NULL,           -- วันเวลาที่ผู้ใช้ยอมรับ Privacy Policy (PDPA)
  privacy_version     VARCHAR(20) NOT NULL,        -- เวอร์ชันข้อความที่ยอมรับ
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- นาฬิกาที่ผู้ใช้ผูกไว้ (device_model_code อ้างถึง kitgle_devices.device_models.code — ไม่มี FK ข้าม DB)
CREATE TABLE IF NOT EXISTS user_devices (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT UNSIGNED NOT NULL,
  device_model_code VARCHAR(64) NOT NULL,
  serial_number     VARCHAR(128) NULL,
  ble_id            VARCHAR(128) NULL,
  nickname          VARCHAR(80) NULL,
  last_connected_at TIMESTAMP NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ud_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ud_user (user_id)
) ENGINE=InnoDB;

-- รายงานปัญหาจากหน้า Setting → Report app
CREATE TABLE IF NOT EXISTS app_reports (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_report_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ระบบที่ 1: MediRemind
CREATE TABLE IF NOT EXISTS medications (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  name       VARCHAR(160) NOT NULL,
  dosage     VARCHAR(80) NULL,
  note       TEXT NULL,                 -- Medication Details
  image_data MEDIUMTEXT NULL,           -- รูปยา (data URI ขนาดเล็ก) TODO: ย้ายไป object storage เมื่อขึ้น production
  active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_med_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_med_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS medication_schedules (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  medication_id BIGINT UNSIGNED NOT NULL,
  time_of_day   TIME NOT NULL,
  days_of_week  VARCHAR(20) NOT NULL DEFAULT '1,2,3,4,5,6,7', -- 1=จันทร์ ... 7=อาทิตย์
  enabled       TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_sched_med FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS medication_logs (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  schedule_id   BIGINT UNSIGNED NOT NULL,
  scheduled_at  DATETIME NOT NULL,
  taken_at      DATETIME NULL,
  status        ENUM('pending','taken','missed','skipped') NOT NULL DEFAULT 'pending',
  CONSTRAINT fk_log_sched FOREIGN KEY (schedule_id) REFERENCES medication_schedules(id) ON DELETE CASCADE,
  INDEX idx_log_time (scheduled_at)
) ENGINE=InnoDB;

-- ระบบที่ 2: Health status
CREATE TABLE IF NOT EXISTS health_records (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  heart_rate  SMALLINT UNSIGNED NULL,
  spo2        TINYINT UNSIGNED NULL,
  steps       INT UNSIGNED NULL,
  temperature DECIMAL(4,1) NULL,
  sleep_minutes SMALLINT UNSIGNED NULL, -- นาทีที่หลับในช่วงบันทึกนั้น (รอ BLE protocol จริง)
  recorded_at DATETIME NOT NULL,
  CONSTRAINT fk_hr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_hr_user_time (user_id, recorded_at)
) ENGINE=InnoDB;

-- ระบบเสริม: Family Link (owner = ผู้ใช้นาฬิกา, member = ญาติที่ขอดู)
CREATE TABLE IF NOT EXISTS family_links (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner_user_id     BIGINT UNSIGNED NOT NULL,
  member_user_id    BIGINT UNSIGNED NOT NULL,
  status            ENUM('pending','accepted','revoked') NOT NULL DEFAULT 'pending',
  can_view_health   TINYINT(1) NOT NULL DEFAULT 1,
  can_view_meds     TINYINT(1) NOT NULL DEFAULT 1,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fl_owner  FOREIGN KEY (owner_user_id)  REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_fl_member FOREIGN KEY (member_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_family (owner_user_id, member_user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked    TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_rt_hash (token_hash)
) ENGINE=InnoDB;
