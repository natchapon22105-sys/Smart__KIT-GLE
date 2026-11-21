import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { GlassPanel } from '@/components/home/GlassPanel';
import { healthColors } from '@/theme/tokens';

/** หัวข้อกราฟ: แถบสีชิดซ้ายจอ + ชื่อ (ตามดีไซน์) */
export function ChartSection({
  tag,
  title,
  children,
}: {
  tag: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.section}>
      <View style={s.tagRow}>
        <View style={[s.tag, { backgroundColor: tag }]} />
        <Text style={s.title}>{title}</Text>
      </View>
      <GlassPanel radius={22} tint={healthColors.panel} border={healthColors.panelBorder} style={s.panel}>
        {children}
      </GlassPanel>
    </View>
  );
}

const Empty = () => <Text style={s.empty}>ยังไม่มีข้อมูล</Text>;

function Grid({ lines = 3 }: { lines?: number }) {
  return (
    <>
      {Array.from({ length: lines }, (_, i) => (
        <View key={i} pointerEvents="none" style={[s.gridWrap, { top: `${((i + 1) / (lines + 1)) * 100}%` }]}>
          <View style={s.grid} />
        </View>
      ))}
    </>
  );
}

/** กราฟแท่ง 7 วัน (null = ไม่มีข้อมูล) — labels ใส่ใต้แท่งได้ (MON..SUN) */
export function BarChart({
  values,
  color,
  labels,
  height = 150,
  unitMax,
}: {
  values: (number | null)[];
  color: string;
  labels?: string[];
  height?: number;
  /** ค่าสูงสุดขั้นต่ำของแกน (กันแท่งเล็กดูใหญ่เกินจริงเมื่อข้อมูลน้อย) */
  unitMax?: number;
}) {
  if (values.every((v) => v == null)) return <View style={{ height }}><Empty /></View>;
  const max = Math.max(unitMax ?? 0, ...values.map((v) => v ?? 0)) || 1;
  return (
    <View>
      <View style={[s.bars, { height }]}>
        {values.map((v, i) => (
          <View key={i} style={s.barSlot}>
            <View style={[s.bar, { height: Math.max(((v ?? 0) / max) * height, v == null ? 0 : 8), backgroundColor: color }]} />
          </View>
        ))}
      </View>
      {labels && (
        <View style={s.labels}>
          {labels.map((l, i) => (
            <Text key={i} style={s.label}>{l}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

/** กราฟเส้น (วาดด้วย View ล้วน ไม่ต้องใช้แพ็กเกจเพิ่ม) — ข้อมูล null จะข้าม */
export function LineChart({
  values,
  color,
  height = 190,
  minSpan = 4,
}: {
  values: (number | null)[];
  color: string;
  height?: number;
  /** ช่วงค่าต่ำสุดของแกน Y ป้องกันเส้นแบนเมื่อค่าเท่ากันหมด */
  minSpan?: number;
}) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const real = values.filter((v): v is number => v != null);
  if (real.length === 0) return <View style={{ height }}><Empty /></View>;

  const pad = 14;
  const lo = Math.min(...real);
  const hi = Math.max(...real);
  const span = Math.max(hi - lo, minSpan);
  const mid = (hi + lo) / 2;
  const yMin = mid - span / 2;
  const n = values.length;
  const pts = values
    .map((v, i) => (v == null ? null : { x: pad + (n === 1 ? (w - 2 * pad) / 2 : (i / (n - 1)) * (w - 2 * pad)), y: pad + (1 - (v - yMin) / span) * (height - 2 * pad) }))
    .filter((p): p is { x: number; y: number } => p != null);

  const T = 4;
  return (
    <View style={{ height }} onLayout={onLayout}>
      <Grid />
      {w > 0 &&
        pts.slice(1).map((b, i) => {
          const a = pts[i]!;
          const len = Math.hypot(b.x - a.x, b.y - a.y);
          const ang = Math.atan2(b.y - a.y, b.x - a.x);
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: (a.x + b.x) / 2 - len / 2,
                top: (a.y + b.y) / 2 - T / 2,
                width: len,
                height: T,
                borderRadius: T / 2,
                backgroundColor: color,
                transform: [{ rotate: `${ang}rad` }],
              }}
            />
          );
        })}
      {w > 0 && pts.length === 1 && (
        <View style={{ position: 'absolute', left: pts[0]!.x - 5, top: pts[0]!.y - 5, width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginTop: 22 },
  tagRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  tag: { width: 98, height: 18, borderTopRightRadius: 9, borderBottomRightRadius: 9, marginRight: 10 },
  title: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 0.3, textShadowColor: 'rgba(255,255,255,0.5)', textShadowRadius: 8 },
  panel: { marginHorizontal: 22, paddingHorizontal: 18, paddingVertical: 14 },
  empty: { color: 'rgba(255,255,255,0.55)', textAlign: 'center', alignSelf: 'center', marginTop: 'auto', marginBottom: 'auto', fontSize: 13 },
  gridWrap: { position: 'absolute', left: 0, right: 0, height: 1, overflow: 'hidden' },
  grid: { height: 2, borderWidth: 1, borderStyle: 'dashed', borderColor: healthColors.grid },
  bars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
  barSlot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', maxWidth: 38, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  labels: { flexDirection: 'row', gap: 8, marginTop: 6 },
  label: { flex: 1, textAlign: 'center', color: healthColors.axisText, fontSize: 11 },
});
