-- ใช้เฉพาะกรณีที่ "เคยรัน 01_schema_users.sql เวอร์ชันเก่าไปแล้ว" (medications ยังไม่มี image_data)
USE kitgle_users;

ALTER TABLE medications
  MODIFY COLUMN note TEXT NULL,
  ADD COLUMN image_data MEDIUMTEXT NULL AFTER note;
