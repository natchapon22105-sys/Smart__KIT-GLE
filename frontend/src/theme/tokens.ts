/**
 * Design tokens — ค่าประมาณจากเฟรม Splash ใน Figma
 * TODO(figma): ซิงก์ค่าจริงด้วย mcp__Figma__get_variable_defs เมื่อได้ลิงก์ไฟล์ Figma
 */
export const colors = {
  bgDark: '#222222',
  bgDarkAlt: '#2C2C2C',
  greenTop: '#4CD04F',
  tealBottom: '#4B9090',
  white: '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.85)',
  cell: 'rgba(30, 70, 60, 0.28)', // วงกลมเซลล์ลอยด้านหลัง
  trackBg: 'rgba(255,255,255,0.35)',
  progressFill: 'rgba(120,120,120,0.85)',
} as const;

/** สีหน้า Sign In / Sign Up / Privacy (ค่าประมาณจากเฟรม Figma — TODO(figma): ซิงก์ค่าจริง) */
export const authColors = {
  card: '#D9D9D9',
  brandGreen: '#2DAA76',
  fieldLabel: '#6A6A6A',
  fieldLine: '#BBD8C8',
  text: '#2B2B2B',
  heroOverlay: 'rgba(0,0,0,0.42)',
  error: '#C0392B',
  info: '#2B6F57',
} as const;

export const gradient = {
  button: ['#37A864', '#3AB5A0'] as [string, string],
  green: [colors.greenTop, colors.tealBottom] as [string, string],
};

/** สีหน้าหลัก (Home) — ค่าประมาณจากเฟรม Figma "KIT-GLE-main" — TODO(figma): ซิงก์ค่าจริง */
export const homeColors = {
  bg: ['#35553F', '#2B4837', '#2A4A3B'] as [string, string, string],
  cell: 'rgba(125, 175, 125, 0.22)',
  glass: 'rgba(255,255,255,0.13)',
  glassBorder: 'rgba(255,255,255,0.22)',
  panelBorder: 'rgba(90, 210, 175, 0.55)',
  tile: 'rgba(18, 48, 34, 0.62)',
  tileBorder: 'rgba(255,255,255,0.16)',
  textMain: 'rgba(255,255,255,0.94)',
  textDim: 'rgba(255,255,255,0.62)',
  username: 'rgba(222,222,222,0.88)',
  connect: '#1BF21B',
  statusPill: '#D9D9D9',
  danger: '#FF1E1E',
  ok: '#1BF21B',
  steps: '#F2762E',
  spo2: '#0A84FF',
  medi: '#14C46A',
  track: 'rgba(0,0,0,0.38)',
  navBg: 'rgba(165,165,165,0.62)',
  navIcon: '#2A2A2A',
} as const;

/** สีหน้า MediRemind (ค่าประมาณจากเฟรม Figma — TODO(figma): ซิงก์ค่าจริง) */
export const mediColors = {
  pill: 'rgba(58, 138, 90, 0.78)', // ปุ่มย้อนกลับ/หัวข้อด้านซ้าย
  card: 'rgba(255,255,255,0.14)',
  cardBorder: 'rgba(255,255,255,0.2)',
  panel: 'rgba(255,255,255,0.1)',
  panelBorder: 'rgba(255,255,255,0.16)',
  field: 'rgba(168,174,172,0.62)',
  imageBox: 'rgba(190,198,195,0.34)',
  imageBorder: 'rgba(20,30,25,0.55)',
  time: '#E9E9E9',
  glow: 'rgba(255,255,255,0.7)',
  fab: '#1BF21B',
  saveGradient: ['#58713A', '#3E8F5E'] as [string, string],
  upload: 'rgba(190,196,194,0.75)',
} as const;

/** สีหน้า Health status (ค่าประมาณจากเฟรม Figma — TODO(figma): ซิงก์ค่าจริง) */
export const healthColors = {
  panel: 'rgba(255,255,255,0.12)',
  panelBorder: 'rgba(255,255,255,0.2)',
  grid: 'rgba(255,255,255,0.5)',
  axisText: 'rgba(255,255,255,0.8)',
  steps: { tag: '#E8651A', bar: '#B26A2F' },
  spo2: { tag: '#1FA3E6', line: '#1AA6F0' },
  sleep: { tag: '#9B3F85', bar: '#6A0F80' },
  heart: { tag: '#8E1212', line: '#7A0D0D' },
} as const;

/** สีหน้า Family Link (ค่าประมาณจากเฟรม Figma — TODO(figma): ซิงก์ค่าจริง) */
export const familyColors = {
  add: '#4FBB07',
  row: 'rgba(255,255,255,0.14)',
  rowBorder: 'rgba(255,255,255,0.3)',
  emptyIcon: 'rgba(20,35,28,0.5)',
  emptyText: 'rgba(150,185,165,0.3)',
  connect: '#1BF21B',
  waiting: '#D9D9D9',
} as const;

export const fonts = {
  // TODO(figma): เปลี่ยนเป็นฟอนต์จริง (โหลดผ่าน expo-font)
  title: undefined as string | undefined,
  mono: 'monospace',
};

export const timing = {
  blobsIn: 3400, // ก้อนเขียวคืบเข้ามาแบบกระดึบ ๆ (ปรับให้เร็ว/ช้าได้ที่นี่)
  merge: 1100,
  expand: 800,
  content: 500,
  progress: 2600,
};
