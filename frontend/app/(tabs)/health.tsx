import React, { useCallback, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MediScreen } from '@/components/medi/MediScreen';
import { BarChart, ChartSection, LineChart } from '@/components/health/charts';
import { health, type HealthSummary } from '@/services/health';
import { healthColors } from '@/theme/tokens';

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/** Health status — กราฟก้าวเดิน / SpO2 / เวลานอน / อัตราการเต้นหัวใจ (ตามเฟรม Figma) */
export default function Health() {
  const router = useRouter();
  const [data, setData] = useState<HealthSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await health.summary());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดข้อมูลสุขภาพไม่สำเร็จ');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const days = data?.days ?? [];
  // วันที่ในรูป YYYY-MM-DD → ชื่อวัน (ใช้เวลาเที่ยงวันกันคลาดเคลื่อนเขตเวลา)
  const labels = days.map((d) => DAY_NAMES[new Date(`${d.date}T12:00:00`).getDay()]!);

  return (
    <MediScreen title="Health status" onBack={() => router.replace('/(tabs)/home')}>
      {error && (
        <Pressable onPress={load} style={{ alignItems: 'center', padding: 12 }}>
          <Text style={{ color: '#FFB4AB', textAlign: 'center' }}>{error}</Text>
          <Text style={{ color: '#fff', fontWeight: '700' }}>แตะเพื่อลองใหม่</Text>
        </Pressable>
      )}

      <ChartSection tag={healthColors.steps.tag} title="COUNT STEPS">
        <BarChart values={days.map((d) => d.steps)} labels={labels} color={healthColors.steps.bar} height={160} />
      </ChartSection>

      <ChartSection tag={healthColors.spo2.tag} title="OXYGEN IN BLOOD (Sp O2 %)">
        <LineChart values={(data?.hourly ?? []).map((h) => h.spo2)} color={healthColors.spo2.line} minSpan={4} />
      </ChartSection>

      {/* TODO(protocol): ข้อมูลเวลานอนยังไม่มีจากนาฬิกา (รอ BLE protocol) — กราฟจะว่างจนกว่าจะส่ง sleepMinutes เข้า /api/health/records */}
      <ChartSection tag={healthColors.sleep.tag} title="SLEEP TIME (HOURS)">
        <BarChart values={days.map((d) => d.sleepHours)} color={healthColors.sleep.bar} height={190} unitMax={8} />
      </ChartSection>

      <ChartSection tag={healthColors.heart.tag} title="HEART RATE (BPM)">
        <LineChart values={(data?.hourly ?? []).map((h) => h.heartRate)} color={healthColors.heart.line} minSpan={20} />
      </ChartSection>
    </MediScreen>
  );
}
