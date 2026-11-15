-- ฐานข้อมูลที่ 2: รายละเอียดอุปกรณ์แต่ละรุ่นในการทำงานกับแอป (kitgle_devices)
CREATE DATABASE IF NOT EXISTS kitgle_devices CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kitgle_devices;

CREATE TABLE IF NOT EXISTS device_models (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code             VARCHAR(64) NOT NULL UNIQUE,   -- เช่น KITGLE-V1
  name             VARCHAR(120) NOT NULL,
  ble_name_prefix  VARCHAR(40) NOT NULL DEFAULT 'KIT-GLE',
  min_app_version  VARCHAR(20) NULL,
  firmware_latest  VARCHAR(20) NULL,
  active           TINYINT(1) NOT NULL DEFAULT 1,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ฟีเจอร์ที่รุ่นนั้นรองรับ (แอปเปิด/ปิดเมนูตามตารางนี้)
CREATE TABLE IF NOT EXISTS device_capabilities (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  model_id  INT UNSIGNED NOT NULL,
  feature   ENUM('medi_remind','health_hr','health_spo2','health_steps','health_temp','family_link') NOT NULL,
  CONSTRAINT fk_cap_model FOREIGN KEY (model_id) REFERENCES device_models(id) ON DELETE CASCADE,
  UNIQUE KEY uq_cap (model_id, feature)
) ENGINE=InnoDB;

-- UUID/รูปแบบข้อมูล BLE ของแต่ละรุ่น (แอปดึงมาแทนการ hardcode)
CREATE TABLE IF NOT EXISTS device_ble_profiles (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  model_id            INT UNSIGNED NOT NULL,
  purpose             ENUM('health','medication','settings') NOT NULL,
  service_uuid        VARCHAR(64) NOT NULL,
  characteristic_uuid VARCHAR(64) NOT NULL,
  direction           ENUM('notify','read','write') NOT NULL,
  payload_format      VARCHAR(255) NULL,          -- คำอธิบายรูปแบบไบต์ (เติมเมื่อได้โปรโตคอลจริง)
  CONSTRAINT fk_ble_model FOREIGN KEY (model_id) REFERENCES device_models(id) ON DELETE CASCADE,
  UNIQUE KEY uq_ble (model_id, purpose)
) ENGINE=InnoDB;

-- ข้อมูลตั้งต้น (PLACEHOLDER UUID — แก้เมื่อมีโปรโตคอลจริง)
INSERT IGNORE INTO device_models (code, name) VALUES ('KITGLE-V1', 'KIT - GLE smart trinket v1');

INSERT IGNORE INTO device_capabilities (model_id, feature)
SELECT id, f FROM device_models, (SELECT 'medi_remind' f UNION SELECT 'health_hr' UNION SELECT 'health_spo2'
  UNION SELECT 'health_steps' UNION SELECT 'family_link') x WHERE code = 'KITGLE-V1';

INSERT IGNORE INTO device_ble_profiles (model_id, purpose, service_uuid, characteristic_uuid, direction, payload_format)
SELECT id, 'health',     '0000FFE0-0000-1000-8000-00805F9B34FB', '0000FFE1-0000-1000-8000-00805F9B34FB', 'notify', 'PLACEHOLDER [hr,spo2,stepsHi,stepsLo]' FROM device_models WHERE code='KITGLE-V1';
INSERT IGNORE INTO device_ble_profiles (model_id, purpose, service_uuid, characteristic_uuid, direction, payload_format)
SELECT id, 'medication', '0000FFE0-0000-1000-8000-00805F9B34FB', '0000FFE2-0000-1000-8000-00805F9B34FB', 'write', 'PLACEHOLDER JSON utf8' FROM device_models WHERE code='KITGLE-V1';
INSERT IGNORE INTO device_ble_profiles (model_id, purpose, service_uuid, characteristic_uuid, direction, payload_format)
SELECT id, 'settings',   '0000FFE0-0000-1000-8000-00805F9B34FB', '0000FFE3-0000-1000-8000-00805F9B34FB', 'write', 'PLACEHOLDER JSON utf8' FROM device_models WHERE code='KITGLE-V1';
