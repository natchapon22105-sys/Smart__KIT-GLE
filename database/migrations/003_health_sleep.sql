-- ใช้เฉพาะกรณีที่ "เคยรัน 01_schema_users.sql เวอร์ชันเก่าไปแล้ว" (health_records ยังไม่มี sleep_minutes)
USE kitgle_users;

ALTER TABLE health_records
  ADD COLUMN sleep_minutes SMALLINT UNSIGNED NULL AFTER temperature;
