import { Alert, Platform } from 'react-native';

/** แจ้งข้อความสั้น ๆ — Alert.alert ของ react-native-web ไม่แสดงอะไร จึงใช้ window.alert บนเว็บ */
export function notify(title: string, message: string) {
  if (Platform.OS === 'web') {
    globalThis.alert?.(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}
