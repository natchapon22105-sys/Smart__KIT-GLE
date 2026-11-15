KIT - GLE — HANDOFF (สรุปส่งต่อให้ AI ตัวถัดไป)

อัปเดตล่าสุด: 2026-11-14 (เพิ่มระบบสมัคร/เข้าสู่ระบบ) · อ่านไฟล์นี้ก่อนแตะโค้ด แล้วอัปเดตหัวข้อ "สถานะ" ทุกครั้งที่ทำงานเสร็จ

1. โปรเจกต์คืออะไร

แอปมือถือ KIT - GLE (smart trinket) ใช้ตั้งค่าและเชื่อมต่อกับ smart watch ที่เจ้าของโปรเจกต์ทำเอง ผ่าน Bluetooth (BLE) ของมือถือ

ระบบที่ต่อกับนาฬิกา: 1) MediRemind (เตือนกินยา) 2) Health status (HR/SpO2/ก้าว/อุณหภูมิ)
ระบบเสริม: Family Link — คนในครอบครัวดูข้อมูลผู้ใช้ในแอปได้ (ต้องได้รับอนุญาตจากเจ้าของ)
ผู้ใช้สื่อสารภาษาไทย → ตอบ/คอมเมนต์เป็นภาษาไทย
เครื่องมือของเจ้าของ: VS Code, Figma, MySQL Workbench
2. กติกาที่เจ้าของโปรเจกต์สั่งไว้ (ห้ามละเมิด)
ดีไซน์อยู่ใน Figma แล้ว — ห้ามเอาดีไซน์อื่นมาแทรกในหน้าที่ออกแบบไว้ สร้างใหม่ได้เฉพาะส่วนที่ไม่มีใน Figma (และต้องบอกเจ้าของ)
โลโก้: ใช้ NudMedi ชั่วคราว (frontend/assets/images/logo.png) เปลี่ยนโลโก้ = แทนที่ไฟล์เดิม ชื่อเดิม ต้องพร้อมเปลี่ยนทันที ห้ามฝังโลโก้ลงในภาพอื่น
พื้นหลังวงกลม ต้องเคลื่อนไหวลอยเหมือนเซลล์ (AnimatedBackground)
แยกโฟลเดอร์ frontend/ กับ backend/ ชัดเจน
รันได้ทั้งมือถือและเว็บ (เว็บใช้ทดสอบ) และโครงสร้างต้องพร้อมขึ้น production
ไม่เข้าใจตรงไหน → ถามเจ้าของได้ทุกเมื่อ อย่าเดา
ต้องมีเอกสารสรุปนี้เพื่อส่งต่อ AI ตัวถัดไปได้ราบรื่น
3. Tech stack (ตัดสินใจแล้ว)
ส่วน	เลือก
Frontend	React Native + Expo (SDK 58) + expo-router + TypeScript
BLE	react-native-ble-plx (ต้อง development build ใช้ Expo Go ไม่ได้) + โหมดจำลอง
Backend	Node 22 + Express 5 + TypeScript, mysql2, zod, JWT
DB	MySQL 8 2 ฐาน: kitgle_users (ผู้ใช้) และ kitgle_devices (รายละเอียดอุปกรณ์แต่ละรุ่น)
Deploy	docker-compose.yml (mysql + backend), backend/Dockerfile

เหตุผล backend: เจ้าของตอบ "สำหรับ IoT" → Node.js เหมาะ (event-driven, ต่อ MQTT/WebSocket ภายหลังง่าย, ภาษาเดียวกับ frontend)

4. โครงสร้างโฟลเดอร์
kit-gle/
├─ frontend/                 Expo app
│  ├─ app/                   routes (expo-router)
│  │  ├─ index.tsx           Splash → /(tabs)/home
│  │  ├─ (auth)/             sign-in, sign-up, privacy  ← ตาม Figma (Sign In / Register / Privacy Policy : PDPA)
│  │  └─ (tabs)/             home (ทำตาม Figma แล้ว), profile/medi-remind/health/device/family ← placeholder รอ Figma (ต้องล็อกอินก่อน; family ซ่อนจากแถบเมนู)
│  ├─ src/components/        SplashIntro, AnimatedBackground, Logo, PendingScreen, BottomNav, home/ (GlassPanel, ProfileHeader, WatchCard, FeatureGrid), auth/ (AuthShell, TextField, GradientButton, SocialRow)
│  ├─ src/services/auth/     AuthContext (login/register/logout + token) · src/services/storage.ts (SecureStore/localStorage)
│  ├─ src/content/           privacyPolicy.ts (ข้อความ PDPA — ฉบับร่าง) · src/utils/notify.ts
│  ├─ src/services/ble/      types.ts (interface), MockBleService, RealBleService, protocol.ts
│  │                         index.ts (เว็บ=mock) / index.native.ts (มือถือ=เลือกตาม env)
│  ├─ src/services/api/      client.ts (fetch + JWT)
│  ├─ src/theme/tokens.ts    สี/ฟอนต์/เวลาอนิเมชัน (ค่าประมาณ — ต้องซิงก์กับ Figma)
│  └─ assets/images/logo.png
├─ backend/src/              app.ts, server.ts, config/, db/pools.ts (2 pools), middleware/auth.ts, routes/
├─ database/                 01_schema_users.sql, 02_schema_devices.sql, migrations/001_add_username_pdpa.sql
├─ docs/                     HANDOFF.md, figma-splash-reference.png
└─ docker-compose.yml, .env.example
5. สถานะ
ทำแล้ว
โครงโปรเจกต์ครบ frontend/backend/database/docker
Splash ตามเฟรม Figma: พื้นมืด → ก้อนเขียว 3 ก้อนลอยเข้าแบบเซลล์ (ยืดหด+หมุน) → ประกบเป็นวงกลม → ขยายเต็มจอ → หน้าโหลด (โลโก้, KIT- GLE, smart trinket, ข้อความ mono, progress bar, LOADING SYSTEM) พร้อมเซลล์ลอยด้านหลัง → ไป /(tabs)/home
อ้างอิงภาพ: docs/figma-splash-reference.png · โค้ด: frontend/src/components/SplashIntro.tsx
หน้าหลัก (Home) ตาม Figma "KIT-GLE-main" (app/(tabs)/home.tsx + src/components/home/*): พื้นหลังเขียวเข้มพร้อมเซลล์ลอย + โลโก้จางเป็นลายน้ำ, ส่วนหัว (รูปโปรไฟล์, UserName/@UserName จากบัญชีที่ล็อกอิน, ปุ่มเพิ่มคนครอบครัว, Status Active/Inactive, Version), การ์ดนาฬิกา (CONNECT/DISCONNECT ต่อ getBleService() ผ่าน src/hooks/useWatch.ts), ช่อง 4 ฟีเจอร์ (MediRemind, Health status, Chat for family, Family Link), แถบเมนูล่าง 5 ปุ่ม (src/components/BottomNav.tsx เป็น custom tabBar: โปรไฟล์ · MediRemind · หน้าหลัก · Health · ตั้งค่า)
Health status แสดงก้าว/SpO2 จริงจากนาฬิกา (หรือโหมดจำลอง) — MediRemind/Chat/Family ยังเป็นโครงตามดีไซน์ ไม่มีข้อมูลจริง
ส่วนที่ ไม่มีใน Figma แล้วผมเพิ่มพื้นฐาน: ข้อความ/ปุ่มสถานะกำลังค้นหา-เชื่อมต่อแล้ว-ผิดพลาด ของการ์ดนาฬิกา, หน้าโปรไฟล์ (placeholder + ปุ่มออกจากระบบชั่วคราว), ปุ่ม Chat for family แสดงแค่ "ยังไม่เปิดใช้งาน"
ไอคอนทั้งหมดเป็น Ionicons ชั่วคราว (TODO(figma): ใช้ไอคอนจริง), เบลอกระจกใช้ backdrop-filter บนเว็บเท่านั้น (บนมือถือเป็นสีโปร่งแสง — ถ้าต้องการเบลอจริงใช้ expo-blur), สีอยู่ใน theme/tokens.ts › homeColors (ค่าประมาณ)
ระบบสมัคร/เข้าสู่ระบบ (ใช้งานจริง): Sign In (อีเมลหรือชื่อผู้ใช้ + รหัสผ่าน), Sign Up (อีเมล, ชื่อผู้ใช้, รหัสผ่าน, ยืนยันรหัสผ่าน, ต้องกดยอมรับ Privacy Policy : PDPA ก่อน), หน้า Privacy → Confirm
Backend: POST /api/auth/register, POST /api/auth/login (identifier = email หรือ username), GET /api/auth/me; bcrypt cost 12, JWT 7 วัน, rate limit (login นับเฉพาะครั้งที่พลาด 10 ครั้ง/15 นาที/IP), เก็บเวลา+เวอร์ชันที่ยอมรับ Privacy (privacy_accepted_at, privacy_version)
Frontend: token เก็บใน SecureStore (มือถือ) / localStorage (เว็บ), เปิดแอปตรวจ token กับ /auth/me; (tabs) ต้องล็อกอิน, (auth) ล็อกอินแล้วจะเด้งไป home; ผู้ใช้ใหม่/ไม่เคยใช้เข้าทาง Splash → Sign In → "Register HERE!"
มือถือต้องใช้ npx expo start --go (เพราะมี expo-dev-client อยู่ ถ้าไม่ใส่ QR จะเป็นของ dev build) และตั้ง EXPO_PUBLIC_API_URL เป็น IP ของคอม (ไม่ใช่ localhost); เครื่องผู้ใช้มี Radmin VPN ให้ตั้ง $env:REACT_NATIVE_PACKAGER_HOSTNAME เป็น IP Wi-Fi จริงกัน Expo เลือกผิด
ปุ่มออกจากระบบชั่วคราวอยู่ที่หน้าโปรไฟล์ (ไว้ทดสอบ) — ย้ายตามดีไซน์จริงภายหลัง
ชั้น BLE: interface เดียว (BleService) สลับ Mock/Real ได้ด้วย EXPO_PUBLIC_USE_MOCK_BLE
Backend: auth (register/login), devices (models + BLE profile), health records, family link (invite/respond/watching/ดูข้อมูลพร้อมตรวจสิทธิ์)
SQL 2 ฐาน + seed รุ่น KITGLE-V1
ตรวจ build/typecheck (2026-11-15): frontend/backend typecheck ผ่าน, backend production build ผ่าน, Expo web production export ผ่าน, expo install --check ผ่าน และ backend /healthz ตอบ HTTP 200; แก้ชนิด ref ของช่องกรอก, custom tab bar และ StyleSheet ให้เข้ากับ Expo/RN ปัจจุบัน
ยังไม่ได้ทำ / ต้องทำต่อ (เรียงตามความสำคัญ)
รอลิงก์ไฟล์ Figma จากเจ้าของ → ใช้ Figma MCP (create_session → get_design_context → get_screenshot, get_variable_defs) สร้างหน้า home / MediRemind / Health / Family Link / Device ให้ตรง Figma 1:1 แล้วลบ PendingScreen; ซิงก์ theme/tokens.ts (สี, ฟอนต์, ขนาด) กับ Figma จริง
โปรโตคอล BLE ของนาฬิกา — เจ้าของ "ยังไม่มีเอกสาร" ตอนนี้ UUID และรูปแบบ payload ใน protocol.ts / RealBleService.ts / seed SQL เป็น PLACEHOLDER ถามเจ้าของ (service/characteristic UUID, รูปไบต์) แล้วแก้ 3 ที่นี้ให้ตรงกัน
Backend: /api/medications (CRUD ยา + ตารางเวลา + logs), refresh token, rate limit, migration tool (ตอนนี้ใช้ไฟล์ .sql ตรง ๆ)
Auth ส่วนที่ยังขาด: Facebook/Google login (ปุ่มมีแต่ยังแจ้ง "ยังไม่เปิดใช้งาน" — ต้องมี Facebook App / Google OAuth Client ID ก่อน), ลืมรหัสผ่าน / ยืนยันอีเมล (ไม่มีใน Figma → ถามเจ้าของก่อน), refresh token, เนื้อหา Privacy Policy จริง (ตอนนี้เป็นฉบับร่างใน src/content/privacyPolicy.ts ต้องให้ผู้รับผิดชอบ/กฎหมายตรวจ; แก้แล้วเปลี่ยน PRIVACY_VERSION ทั้งสองฝั่งให้ตรงกัน)
ฟอนต์จริง (expo-font), โลโก้จริงแทน NudMedi, app icon/splash ของ native (ตอนนี้ icon = logo.png)
ขอสิทธิ์ BLE runtime บน Android 12+ (BLUETOOTH_SCAN/CONNECT) — ใส่ใน app.json แล้ว แต่ยังไม่มี flow ขอสิทธิ์ใน UI
เทสต์ (unit/e2e), CI, EAS Build config (eas.json) สำหรับปล่อยสโตร์
6. สิ่งที่ "ยังไม่ได้ตรวจสอบ" (สำคัญ)

ตรวจแล้วตามรายการในข้อ 5 แต่ ระบบ auth ยังไม่เคยทดสอบกับ MySQL จริง — ต้องรัน SQL → backend → แอป แล้วลองสมัคร/ออก/ล็อกอิน/ปิดเปิดแอป (ดูข้อ 7)

ยังไม่มี automated unit/e2e test scripts ใน frontend/backend; การตรวจครั้งนี้เป็น typecheck, build/export และ health endpoint smoke test
ยังไม่ได้ build/ทดสอบบนอุปกรณ์ iOS/Android จริง; BLE, permission flow และการเชื่อมต่อฐานข้อมูลต้องทดสอบแยกก่อนปล่อย store
TypeScript 6 ลบ baseUrl แล้ว → frontend/tsconfig.json ใช้ paths: {"@/*": ["./src/*"]} แบบไม่มี baseUrl อย่าเติมกลับ
npx expo install --check ผ่าน; ยังไม่รัน npx expo install --fix เพราะไม่มี dependency mismatch
จุดเสี่ยงที่ควรเช็กก่อน: BLE UUID/payload ยังเป็น placeholder, permission flow บน Android 12+, การเชื่อม MySQL จริง, และภาพ/แอนิเมชัน Splash บนเว็บเทียบ Figma
Splash ยังไม่ได้ดูผลจริงเทียบ Figma → ปรับจังหวะ/รูปทรงก้อนใน BLOBS และ theme/tokens.ts › timing
7. วิธีรัน
bash
# 1) ฐานข้อมูล: เปิด MySQL Workbench รัน database/01_schema_users.sql และ 02_schema_devices.sql
# 2) Backend
cd backend && cp .env.example .env   # ใส่ DB_PASSWORD, JWT_SECRET
npm install && npm run dev           # http://localhost:4000/api/ping
# ถ้าเคยรัน 01_schema_users.sql เวอร์ชันเก่าไปแล้ว (ตาราง users ไม่มี username) ให้รัน database/migrations/001_add_username_pdpa.sql ด้วย
# 3) Frontend
cd frontend && cp .env.example .env   # EXPO_PUBLIC_API_URL: เว็บ=http://localhost:4000 | Android emulator=http://10.0.2.2:4000 | มือถือจริง=http://<IP คอม>:4000
npm install && npx expo install --fix
npm run web                          # ทดสอบบนเว็บ (BLE = จำลอง)
npx expo run:android                 # มือถือ + BLE จริง (dev build) ตั้ง EXPO_PUBLIC_USE_MOCK_BLE=false

มือถือจริงต่อ backend: ตั้ง EXPO_PUBLIC_API_URL เป็น IP เครื่องคอมในวง Wi-Fi เดียวกัน และเพิ่ม origin ใน CORS_ORIGINS ของ backend

8. หมายเหตุออกแบบสำคัญ
UI ห้ามเรียก BLE ตรง ให้ผ่าน getBleService() เท่านั้น (สลับ mock/real และรองรับเว็บ)
.native.ts / .ts คู่กัน: Metro เลือกไฟล์ตามแพลตฟอร์ม เพื่อไม่ให้เว็บ import react-native-ble-plx
DB 2 ฐานไม่มี FK ข้ามกัน: user_devices.device_model_code อ้างถึง device_models.code ด้วยค่าข้อความ ตรวจที่ชั้นแอป
Family Link: ตรวจสิทธิ์ status='accepted' + can_view_* ทุกครั้งก่อนคืนข้อมูลของ owner (ดู routes/family.ts)
ข้อมูลสุขภาพเป็นข้อมูลอ่อนไหว: production ต้องใช้ HTTPS, เปลี่ยน JWT_SECRET, ไม่ log ข้อมูลสุขภาพ
9. คำถามที่ยังค้างกับเจ้าของโปรเจกต์
ลิงก์ไฟล์ Figma (ทุกหน้า)
เอกสารโปรโตคอล BLE ของนาฬิกา หรือใครเป็นคนเขียนเฟิร์มแวร์
มีหน้า login/register ใน Figma ไหม → มีแล้ว (Sign In / Register / Privacy) ทำเสร็จ; ใน Figma สะกด "WLECOM" และตัวอักษร T / O เรียงแนวตั้ง — โค้ดทำตาม Figma ตรง ๆ (แก้ที่ WELCOME_LINES ใน AuthShell.tsx) ควรถามเจ้าของว่าตั้งใจหรือพิมพ์ผิด
ฟอนต์ที่ใช้ใน Figma
10. ข้อควรระวังที่แก้ไปแล้ว (อย่าแก้กลับ / ทำซ้ำ)

สรุปจากการทดสอบจริงของเจ้าของโปรเจกต์ (Windows + PowerShell + iPhone) — ใช้เป็นความจำของโปรเจกต์

Expo SDK 58: Expo Go บน iPhone รองรับเฉพาะ SDK ล่าสุดเท่านั้น (ลงรุ่นเก่าไม่ได้) จึงอัปเกรดจาก 57 → 58 แล้ว
รันบนมือถือต้องใช้ npx expo start --go เพราะโปรเจกต์มี expo-dev-client — ถ้าไม่ใส่ QR จะเป็นของ dev build แล้ว Expo Go/กล้องมือถืออ่านไม่ได้ (iPhone ขึ้น "ไม่พบข้อมูลที่ใช้งานได้")
frontend/tsconfig.json ห้ามมี baseUrl (TypeScript 6 ลบออกแล้ว) ใช้ paths: {"@/*": ["./src/*"]} อย่างเดียว
แถบเมนูล่าง (BottomNav.tsx): ใช้ navigateToTab(route.key) และชนิด props จาก Tabs['tabBar'] — ห้ามเปลี่ยนกลับเป็น navigation.navigate; (tabs)/_layout.tsx ไม่ใส่ initialRouteName; หน้า family ซ่อนด้วย href: null
ใช้ StyleSheet.absoluteFill (ไม่ใช่ absoluteFillObject) และชนิด ref ของ TextInput ใช้ React.ComponentRef<typeof TextInput>
ห้ามรัน npm audit fix --force — เคยทำให้ expo ถอยเป็น 52 / react 18 จน metro พัง (ต้องล้าง node_modules + package-lock.json แล้วลงใหม่); frontend/.npmrc ตั้ง legacy-peer-deps=true กัน ERESOLVE ไว้แล้ว
Alert.alert ไม่แสดงอะไรบนเว็บ (react-native-web) → ใช้ src/utils/notify.ts แทน
setup.ps1 ต้องเป็น ASCII ล้วน — Windows PowerShell 5.1 อ่านไฟล์ UTF-8 ไม่มี BOM ผิด ข้อความไทยทำให้ parse พัง
มือถือต่อ backend: frontend/.env → EXPO_PUBLIC_API_URL ต้องเป็น IP ของคอม (ไม่ใช่ localhost), ต้องเปิดพอร์ต 8081 กับ 4000 ใน Windows Firewall, แก้ .env แล้วต้องรัน npx expo start -c; เครื่องเจ้าของมี Radmin VPN (26.x) → ตั้ง $env:REACT_NATIVE_PACKAGER_HOSTNAME เป็น IP Wi-Fi จริงกัน Expo เลือกผิด; ฮอตสปอต iPhone (172.20.10.x) IP เปลี่ยนได้ทุกครั้ง
เข้าครั้งแรกต้อง Register ก่อน (ยังไม่มีบัญชีใน DB) — Login ก่อนสมัครจะขึ้น "อีเมล/ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง"
ไฟล์ข้อความต้องบันทึกเป็น UTF-8 (README.md ใน repo เคยถูกบันทึกเป็นรหัสที่ GitHub อ่านไม่ออก)
ห้าม commit ไฟล์ .env (มีรหัสผ่าน DB และ JWT_SECRET) — ตอนนี้ใน repo มีแต่ .env.example
Figma หน้า Sign In เดิมสะกด "WLECOM / T / O" — แก้เป็น "WELCOME TO" แล้ว (WELCOME_LINES ใน AuthShell.tsx)