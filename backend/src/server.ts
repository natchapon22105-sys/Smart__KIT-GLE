import { createApp } from './app.js';
import { env } from './config/env.js';

createApp().listen(env.PORT, () => {
  console.log(`KIT-GLE backend listening on :${env.PORT} (${env.NODE_ENV})`);
});

// กัน process ล้มจาก promise ที่ไม่ได้จับ
process.on('unhandledRejection', (e) => console.error('unhandledRejection', e));
