import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

const base = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
};

/** DB 1: ข้อมูลผู้ใช้งาน */
export const usersDb = mysql.createPool({ ...base, database: env.DB_USERS_NAME });
/** DB 2: รายละเอียดอุปกรณ์แต่ละรุ่น */
export const devicesDb = mysql.createPool({ ...base, database: env.DB_DEVICES_NAME });
