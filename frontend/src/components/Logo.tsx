import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

/**
 * โลโก้แอป — เปลี่ยนโลโก้ได้โดยแทนที่ไฟล์ assets/images/logo.png (ชื่อเดิม) แล้วรีโหลด
 * ตอนนี้ใช้โลโก้ NudMedi ชั่วคราวตามที่ผู้ใช้ส่งมา
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const LOGO = require('../../assets/images/logo.png');

export function Logo({ size = 400, style }: { size?: number; style?: StyleProp<ImageStyle> }) {
  return <Image source={LOGO} style={[{ width: size, height: size }, style]} resizeMode="contain" />;
}
