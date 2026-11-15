import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from './GlassPanel';
import type { MedicationDoseStatus, UpcomingMedicationDose } from '@/services/medications';
import { homeColors } from '@/theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function Tile({
  icon,
  title,
  onPress,
  children,
}: {
  icon: IconName;
  title: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable style={styles.tileWrap} onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
      <View style={styles.tile}>
        <View style={styles.tileHead}>
          <Ionicons name={icon} size={18} color={homeColors.textMain} />
          <Text style={styles.tileTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View style={styles.tileLine} />
        {children}
      </View>
    </Pressable>
  );
}

function Bar({ pct, color }: { pct: number; color: string }) {
  const w = `${Math.max(0, Math.min(100, pct))}%` as `${number}%`;
  return (
    <View style={styles.track}>
      <View style={{ width: w, height: '100%', backgroundColor: color, borderRadius: 5 }} />
    </View>
  );
}

function AvatarStack() {
  return (
    <View style={styles.stack}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.stackDot, { marginLeft: i === 0 ? 0 : -14 }]} />
      ))}
    </View>
  );
}

const pad = (n: number, len: number) => String(Math.max(0, Math.round(n))).padStart(len, '0');
const WEEKDAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

function formatDoseDate(date: Date, now: Date) {
  const dayStart = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const dayOffset = Math.round((dayStart(date) - dayStart(now)) / 86_400_000);
  if (dayOffset === 0) return 'วันนี้';
  if (dayOffset === 1) return 'พรุ่งนี้';
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
}

/**
 * ช่อง 4 ฟีเจอร์ในแผงขอบเขียวอมฟ้า (ตาม Figma): MediRemind · Health status · Chat for family · Family Link
 * - Health status ใช้ค่าจริงจากนาฬิกา (หรือจำลอง); เป้าหมายก้าวสำหรับหลอดแถบ = 10,000
 * - MediRemind แสดงคิวยาที่จะถึงจาก /api/medications; Chat / Family ยังเป็นโครงตามดีไซน์
 */
export function FeatureGrid({
  steps,
  spo2,
  nextDose,
  doseStatus,
  doseStatusSaving,
  medicationLoading,
  medicationError,
  now,
  onToggleDoseStatus,
  onMedi,
  onHealth,
  onChat,
  onFamily,
}: {
  steps: number;
  spo2: number;
  nextDose: UpcomingMedicationDose | null;
  doseStatus: MedicationDoseStatus | null;
  doseStatusSaving: boolean;
  medicationLoading: boolean;
  medicationError: boolean;
  now: Date;
  onToggleDoseStatus: () => void;
  onMedi: () => void;
  onHealth: () => void;
  onChat: () => void;
  onFamily: () => void;
}) {
  const doseSubtitle = medicationError
    ? 'โหลดคิวไม่สำเร็จ'
    : medicationLoading
      ? 'กำลังโหลดคิวยา...'
      : nextDose
        ? `${formatDoseDate(nextDose.scheduledAt, now)}${nextDose.medication.details ? ` · ${nextDose.medication.details}` : ''}`
        : 'ยังไม่มีรายการยาที่จะถึง';

  return (
    <GlassPanel radius={30} border={homeColors.panelBorder} style={styles.panel}>
      <View style={styles.grid}>
        <Tile icon="time-outline" title="MediRemind" onPress={onMedi}>
          <Text style={styles.clock}>
            {nextDose
              ? `${pad(nextDose.scheduledAt.getHours(), 2)} : ${pad(nextDose.scheduledAt.getMinutes(), 2)}`
              : '00 : 00'}
          </Text>
          <View style={styles.detailBox}>
            <Text style={styles.detailText} numberOfLines={1}>
              {nextDose ? nextDose.medication.name : 'Medication Details :'}
            </Text>
            <Text style={styles.detailSubText} numberOfLines={1}>
              {doseSubtitle}
            </Text>
          </View>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onToggleDoseStatus();
            }}
            disabled={!nextDose || !doseStatus || doseStatusSaving || medicationLoading || medicationError}
            accessibilityRole="button"
            accessibilityLabel={
              doseStatus === 'taken'
                ? 'กินยาแล้ว แตะเพื่อยกเลิกสถานะ'
                : 'ยังไม่ได้กินยา แตะเพื่อบันทึกว่ากินแล้ว'
            }
            style={styles.mediRow}
          >
            <LinearGradient
              colors={
                doseStatus === 'taken'
                  ? ['#0EAA68', '#25D77B']
                  : doseStatus === 'pending'
                    ? ['#D64A4A', '#FF1E1E']
                    : ['#777777', '#999999']
              }
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.mediBar}
            />
            <View
              style={[
                styles.mediDot,
                {
                  backgroundColor:
                    doseStatus === 'taken' ? homeColors.medi : doseStatus ? homeColors.danger : '#999999',
                },
              ]}
            />
          </Pressable>
        </Tile>

        <Tile icon="stats-chart" title="Health status" onPress={onHealth}>
          <View style={styles.metricHead}>
            <View style={[styles.metricDot, { backgroundColor: homeColors.steps }]} />
            <Text style={styles.metricLabel}>Count steps</Text>
          </View>
          <View style={styles.metricRow}>
            <View style={{ flex: 1 }}>
              <Bar pct={(steps / 10000) * 100} color={homeColors.steps} />
            </View>
            <Text style={styles.metricValue}>{pad(Math.min(steps, 99999), 4)}</Text>
          </View>
          <View style={[styles.metricHead, { marginTop: 10 }]}>
            <View style={[styles.metricDot, { backgroundColor: homeColors.spo2 }]} />
            <Text style={styles.metricLabel}>SpO2</Text>
          </View>
          <View style={styles.metricRow}>
            <View style={{ flex: 1 }}>
              <Bar pct={spo2} color={homeColors.spo2} />
            </View>
            <Text style={styles.metricValue}>{pad(Math.min(spo2, 100), 2)}%</Text>
          </View>
        </Tile>

        <Tile icon="chatbubbles-outline" title="Chat for family" onPress={onChat}>
          <View style={styles.inner}>
            <AvatarStack />
            <View style={styles.pill} />
          </View>
        </Tile>

        <Tile icon="people-circle-outline" title="Family Link" onPress={onFamily}>
          <View style={styles.inner}>
            <AvatarStack />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <View style={styles.pill} />
            </View>
          </View>
          <View style={[styles.skel, { width: '62%', marginTop: 8 }]} />
          <View style={[styles.skel, { width: '78%', marginTop: 6, alignSelf: 'flex-end' }]} />
        </Tile>
      </View>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  panel: { width: '100%', padding: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  tileWrap: { width: '48.5%' },
  tile: {
    minHeight: 150,
    borderRadius: 20,
    padding: 10,
    backgroundColor: homeColors.tile,
    borderWidth: 1,
    borderColor: homeColors.tileBorder,
  },
  tileHead: { flexDirection: 'row', alignItems: 'center' },
  tileTitle: { flex: 1, marginLeft: 5, fontSize: 14, fontWeight: '900', color: homeColors.textMain },
  tileLine: { height: 1, backgroundColor: 'rgba(255,255,255,0.35)', marginTop: 5, marginBottom: 8 },

  clock: { fontSize: 30, fontWeight: '800', letterSpacing: 2, color: homeColors.textMain, textAlign: 'center' },
  detailBox: {
    marginTop: 6,
    height: 34,
    padding: 4,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  detailText: { fontSize: 8, fontWeight: '800', color: homeColors.textMain },
  detailSubText: { marginTop: 2, fontSize: 7, color: homeColors.textDim },
  mediRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  mediBar: { flex: 1, height: 9, borderRadius: 5 },
  mediDot: { width: 12, height: 12, borderRadius: 6, marginLeft: 4 },

  metricHead: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  metricDot: { width: 9, height: 9, borderRadius: 5 },
  metricLabel: { marginLeft: 5, fontSize: 11, fontWeight: '800', color: homeColors.textMain },
  metricRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  metricValue: { marginLeft: 6, minWidth: 34, textAlign: 'right', fontSize: 11, color: homeColors.textMain },
  track: { height: 10, borderRadius: 5, backgroundColor: homeColors.track, overflow: 'hidden' },

  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  stack: { flexDirection: 'row', alignItems: 'center' },
  stackDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(215,215,215,0.92)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  pill: { height: 22, minWidth: 56, flex: 1, marginLeft: 8, borderRadius: 11, backgroundColor: 'rgba(220,220,220,0.85)' },
  skel: { height: 5, borderRadius: 3, backgroundColor: 'rgba(220,220,220,0.7)' },
});
