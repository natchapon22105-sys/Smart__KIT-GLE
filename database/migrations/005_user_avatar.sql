-- ใช้เฉพาะกรณีที่ "เคยรัน 01_schema_users.sql เวอร์ชันเก่าไปแล้ว" (users ยังไม่มี avatar_data)
USE kitgle_users;

ALTER TABLE users
  ADD COLUMN avatar_data MEDIUMTEXT NULL AFTER weight_kg;
