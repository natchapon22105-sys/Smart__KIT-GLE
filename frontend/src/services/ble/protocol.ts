/** UUIDs and advertising name used by the ESP32-C3 SmartWatch firmware. */
export const BLE_PROFILE = {
  service: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  characteristics: {
    clock: '6e400002-b5a3-f393-e0a9-e50e24dcca9e', // write: yyyy/mm/dd HH:mm:ss
    fall: '6e400003-b5a3-f393-e0a9-e50e24dcca9e', // notify: "FALL"
    imu: '6e400004-b5a3-f393-e0a9-e50e24dcca9e', // notify: binary 0xA1 frames
  },
} as const;

/** ชื่อโฆษณา (advertising name) ที่ใช้กรองตอนสแกน */
export const DEVICE_NAME_PREFIX = 'SmartWatch';
