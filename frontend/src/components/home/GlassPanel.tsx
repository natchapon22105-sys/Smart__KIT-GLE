import React from 'react';
import { Platform, StyleProp, View, ViewStyle } from 'react-native';
import { homeColors } from '@/theme/tokens';

type Props = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  tint?: string;
  border?: string;
};

// เบลอพื้นหลังบนเว็บ (backdrop-filter) — บนมือถือใช้สีโปร่งแสงล้วน (ถ้าต้องการเบลอจริงบนมือถือ ใช้ expo-blur ภายหลัง)
const webBlur = (Platform.OS === 'web' ? { backdropFilter: 'blur(14px)' } : {}) as ViewStyle;

/** แผงกระจกฝ้าโปร่งแสงตามดีไซน์ (การ์ดนาฬิกา, ปุ่มเพิ่มคน ฯลฯ) */
export function GlassPanel({
  children,
  style,
  radius = 28,
  tint = homeColors.glass,
  border = homeColors.glassBorder,
}: Props) {
  return (
    <View
      style={[
        { borderRadius: radius, backgroundColor: tint, borderWidth: 1, borderColor: border, overflow: 'hidden' },
        webBlur,
        style,
      ]}
    >
      {children}
    </View>
  );
}
