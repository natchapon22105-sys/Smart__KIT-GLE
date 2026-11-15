/**
 * โปรโตคอล BLE ของนาฬิกา KIT-GLE
 *
 * !! ยังเป็นค่า PLACEHOLDER !! ผู้ใช้ยังไม่มีเอกสารโปรโตคอล
 * เมื่อมีแล้ว: แก้ไฟล์นี้ + (ระยะยาว) ย้ายไปเก็บใน DB "รายละเอียดอุปกรณ์แต่ละรุ่น"
 * ตาราง device_ble_profiles เพื่อให้แต่ละรุ่นใช้ UUID ต่างกันได้โดยไม่ต้องแก้แอป
 */
export const BLE_PROFILE = {
  service: '0000FFE0-0000-1000-8000-00805F9B34FB',
  characteristics: {
    health: '0000FFE1-0000-1000-8000-00805F9B34FB', // notify
    medication: '0000FFE2-0000-1000-8000-00805F9B34FB', // write
    settings: '0000FFE3-0000-1000-8000-00805F9B34FB', // write
  },
} as const;

/** ชื่อโฆษณา (advertising name) ที่ใช้กรองตอนสแกน */
export const DEVICE_NAME_PREFIX = 'KIT-GLE';
