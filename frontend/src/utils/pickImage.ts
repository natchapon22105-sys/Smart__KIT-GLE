import * as ImagePicker from 'expo-image-picker';
import { notify } from '@/utils/notify';

const MAX_CHARS = 1_400_000;

/** เลือกรูปจากคลังภาพ (ครอปสี่เหลี่ยมจัตุรัส ลดคุณภาพ) คืนค่าเป็น data URI หรือ null ถ้ายกเลิก */
export async function pickSquareImage(): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.35,
    base64: true,
  });
  if (res.canceled || !res.assets[0]) return null;
  const a = res.assets[0];
  const uri = a.base64 ? `data:${a.mimeType ?? 'image/jpeg'};base64,${a.base64}` : a.uri;
  if (!uri.startsWith('data:image/')) {
    notify('เลือกรูปไม่สำเร็จ', 'ไม่สามารถอ่านรูปนี้ได้ ลองเลือกรูปอื่น');
    return null;
  }
  if (uri.length > MAX_CHARS) {
    notify('รูปใหญ่เกินไป', 'กรุณาเลือกรูปที่มีขนาดเล็กลง');
    return null;
  }
  return uri;
}
