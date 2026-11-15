import React, { useEffect, useMemo } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors } from '@/theme/tokens';

const ND = Platform.OS !== 'web';

type Cell = {
  /** ตำแหน่งกึ่งกลางเป็นสัดส่วนหน้าจอ (อนุญาตเกินขอบ) */
  x: number;
  y: number;
  /** เส้นผ่านศูนย์กลางเป็นสัดส่วนความกว้างจอ */
  size: number;
  drift: number; // ระยะลอย (px)
  duration: number;
  delay: number;
};

// วงกลมเซลล์ชิดขอบขวา/ซ้าย ตามเฟรมโหลดใน Figma
const DEFAULT_CELLS: Cell[] = [
  { x: 1.0, y: 0.02, size: 0.16, drift: 14, duration: 5200, delay: 0 },
  { x: -0.02, y: 0.14, size: 0.14, drift: 12, duration: 6100, delay: 400 },
  { x: 1.02, y: 0.3, size: 0.2, drift: 18, duration: 6800, delay: 900 },
  { x: -0.03, y: 0.5, size: 0.17, drift: 16, duration: 5700, delay: 200 },
  { x: 1.03, y: 0.72, size: 0.18, drift: 16, duration: 6400, delay: 600 },
  { x: -0.02, y: 0.78, size: 0.15, drift: 12, duration: 5400, delay: 1100 },
  { x: 1.0, y: 0.97, size: 0.15, drift: 12, duration: 5900, delay: 300 },
];

function FloatingCell({ cell, w, h, color }: { cell: Cell; w: number; h: number; color: string }) {
  const t = useMemo(() => new Animated.Value(0), []);
  const size = cell.size * w;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: cell.duration, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
        Animated.timing(t, { toValue: 0, duration: cell.duration, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
      ]),
    );
    const timer = setTimeout(() => loop.start(), cell.delay);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [t, cell.duration, cell.delay]);

  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [-cell.drift, cell.drift] });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [cell.drift * 0.8, -cell.drift * 0.8] });
  const scale = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.92, 1.08, 0.92] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: cell.x * w - size / 2,
        top: cell.y * h - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    />
  );
}

/** วงกลมลอยเคลื่อนที่อยู่พื้นหลัง เหมือนเซลล์ — วางไว้หลังเนื้อหา */
export function AnimatedBackground({
  cells = DEFAULT_CELLS,
  height: fixedHeight,
  color = colors.cell,
}: {
  cells?: Cell[];
  height?: number;
  /** สีของวงกลมเซลล์ (ค่าเริ่มต้น = สีหน้า Splash/Auth) */
  color?: string;
}) {
  const { width, height: windowHeight } = useWindowDimensions();
  const height = fixedHeight ?? windowHeight;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {cells.map((c, i) => (
        <FloatingCell key={i} cell={c} w={width} h={height} color={color} />
      ))}
    </View>
  );
}
