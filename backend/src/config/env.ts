import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGINS: z.string().default('http://localhost:8081'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET ต้องยาวอย่างน้อย 16 ตัวอักษร'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_USERS_NAME: z.string().default('kitgle_users'),
  DB_DEVICES_NAME: z.string().default('kitgle_devices'),
});

export const env = schema.parse(process.env);
