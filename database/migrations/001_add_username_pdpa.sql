-- ใช้เฉพาะกรณีที่ "เคยรัน 01_schema_users.sql เวอร์ชันเก่าไปแล้ว" (ตาราง users ยังไม่มี username)
-- ถ้ายังไม่เคยรัน 01 เลย ไม่ต้องใช้ไฟล์นี้ — 01 เวอร์ชันใหม่มีคอลัมน์ครบแล้ว
-- หากตาราง users มีข้อมูลทดสอบ ให้ลบก่อน: DELETE FROM users;
USE kitgle_users;

ALTER TABLE users
  ADD COLUMN username VARCHAR(30) NOT NULL AFTER email,
  ADD COLUMN privacy_accepted_at DATETIME NOT NULL AFTER birth_date,
  ADD COLUMN privacy_version VARCHAR(20) NOT NULL AFTER privacy_accepted_at,
  ADD UNIQUE KEY uq_users_username (username);
