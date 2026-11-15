import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { GlassPanel } from '@/components/home/GlassPanel';
import { healthColors } from '@/theme/tokens';

export const CARD_HEIGHT = 227;

/** หัวข้อ: แถบสีชิดซ้าย + ชื่อกราฟ (ตามเฟรม Figma) */
export function SectionLabel({ title, color }: { title: string; color: string }) {
  return (
    <View style={styles.labelRow}>
      <View style={[styles.labelBar, { backgroundColor: color }]} />
      <Text style={styles.labelText}>{title}</Text>
    </View>
  );
}

/** การ์ดกระจกฝ้าที่ใส่กราฟ */
export function ChartCard({ children, left = 33, right = 25 }: { children: React.ReactNode; left?: number; right?: number }) {
  return (
    <GlassPanel
      radius={22}
      tint={healthColors.card}
      border={healthColors.cardBorder}
      style={{ height: CARD_HEIGHT, marginLeft: left, marginRight: right }}
    >
      {children}
    </GlassPanel>
  );
}

function useWidth() {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(Math.round(e.nativeEvent.layout.width));
  return [w, onLayout] as const;
}

/** กราฟแท่ง (ก้าว / ชั่วโมงนอน) — labels ใส่หรือไม่ก็ได้ */
export function BarChart({
  values,
  max,
  color,
  labels,
}: {
  values: number[];
  max: number;
  color: string;
  labels?: string[];
}) {
  const [w, onLayout] = useWidth();
  const padX = 18;
  const top = labels ? 22 : 26;
  const bottom = labels ? 39 : 31;
  const areaH = CARD_HEIGHT - top - bottom;
  const slot = (w - padX * 2) / values.length;
  const barW = slot * 0.72;
  // แท่งต่ำสุดยังเห็นได้ (ค่าน้อยมากไม่หายไปเลย)
  const minH = 6;

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      {w > 0 && (
        <Svg width={w} height={CARD_HEIGHT}>
          {values.map((v, i) => {
            const h = Math.max(minH, (Math.min(v, max) / max) * areaH);
            return (
              <Rect
                key={i}
                x={padX + slot * i + (slot - barW) / 2}
                y={top + areaH - h}
                width={barW}
                height={h}
                rx={4}
                fill={color}
              />
            );
          })}
        </Svg>
      )}
      {labels && (
        <View style={[styles.axis, { left: padX, right: padX }]} pointerEvents="none">
          {labels.map((l) => (
            <Text key={l} style={styles.axisText}>
              {l}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

// เส้นประแนวนอน 3 เส้น และขอบเขตเส้นกราฟ (พิกเซลในการ์ดสูง 227 ตาม Figma)
const GRID_Y = [42, 118, 182];
const LINE_TOP = 27;
const LINE_BOTTOM = 204;

/** กราฟเส้น (SpO2 / HR) เส้นไล่สีบน→ล่าง พร้อมเส้นประ */
export function LineChart({
  id,
  values,
  min,
  max,
  gradient,
}: {
  id: string;
  values: number[];
  min: number;
  max: number;
  gradient: [string, string];
}) {
  const [w, onLayout] = useWidth();
  const padL = 12;
  const padR = 21;
  const step = values.length > 1 ? (w - padL - padR) / (values.length - 1) : 0;
  const pts = values.map((v, i) => {
    const t = (Math.min(Math.max(v, min), max) - min) / (max - min);
    return [padL + step * i, LINE_BOTTOM - t * (LINE_BOTTOM - LINE_TOP)] as const;
  });
  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      {w > 0 && (
        <Svg width={w} height={CARD_HEIGHT}>
          <Defs>
            <LinearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={LINE_TOP} x2="0" y2={LINE_BOTTOM}>
              <Stop offset="0" stopColor={gradient[0]} />
              <Stop offset="1" stopColor={gradient[1]} />
            </LinearGradient>
          </Defs>
          {GRID_Y.map((y) => (
            <Line
              key={y}
              x1={7}
              x2={w - 9}
              y1={y}
              y2={y}
              stroke={healthColors.grid}
              strokeWidth={1}
              strokeDasharray="5 4"
            />
          ))}
          <Path d={d} fill="none" stroke={`url(#${id})`} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', alignItems: 'center', height: 20, marginBottom: 8 },
  labelBar: { width: 100, height: 18, borderTopRightRadius: 9, borderBottomRightRadius: 9 },
  labelText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(255,255,255,0.55)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  axis: { position: 'absolute', bottom: 8, flexDirection: 'row' },
  axisText: { flex: 1, textAlign: 'center', fontSize: 13, color: healthColors.axisText },
});
