import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { mediColors } from '@/theme/tokens';

/** ตัวเลขเวลา 00:00 ตัวหนามีแสงเรืองตามดีไซน์ */
export function TimeText({ time, size, style }: { time: string; size: number; style?: StyleProp<TextStyle> }) {
  return (
    <Text
      style={[styles.t, { fontSize: size, lineHeight: size * 1.1 }, style]}
      allowFontScaling={false}
      numberOfLines={1}
      adjustsFontSizeToFit
    >
      {time}
    </Text>
  );
}

const styles = StyleSheet.create({
  t: {
    fontWeight: '900',
    color: mediColors.time,
    textShadowColor: mediColors.glow,
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 0 },
  },
});
