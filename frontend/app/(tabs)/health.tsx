import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MediScreen } from '@/components/medi/MediScreen';
import { BarChart, ChartCard, LineChart, SectionLabel } from '@/components/health/HealthCharts';
import { DEMO, WEEK_LABELS, healthApi, latestSeries, weeklySteps } from '@/services/health';
import { healthColors, homeColors } from '@/theme/tokens';

type Data = { steps: number[] | null; spo2: number[] | null; heartRate: number[] | null };

/**
 * Health status — ตามเฟรม Figma (ก้าว · SpO2 · เวลานอน · อัตราการเต้นหัวใจ)
 * ข้อมูลจริงมาจาก GET /api/health/records; ถ้ายังไม่มีข้อมูลจะแสดงกราฟตัวอย่างตามดีไซน์
 * TODO: เวลานอนยังไม่มีแหล่งข้อมูล (ไม่มีใน DB/BLE) → ใช้ตัวอย่างเสมอ
 */
export default function Health() {
  const router = useRouter();
  const [data, setData] = useState<Data>({ steps: null, spo2: null, heartRate: null });

  // โหลดตอนเข้าหน้า แล้วรีเฟรชทุก 30 วินาทีขณะเปิดอยู่ (ข้อมูลใหม่จากนาฬิกาเข้า DB ผ่าน useHealthSync)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = () =>
        healthApi
          .records()
          .then((records) => {
            if (!active) return;
            setData({
              steps: weeklySteps(records),
              spo2: latestSeries(records, 'spo2'),
              heartRate: latestSeries(records, 'heart_rate'),
            });
          })
          .catch(() => {
            // โหลดไม่ได้ → คงข้อมูลเดิม/กราฟตัวอย่างไว้
          });
      void load();
      const timer = setInterval(load, 30_000);
      return () => {
        active = false;
        clearInterval(timer);
      };
    }, []),
  );

  const usingDemo = !data.steps || !data.spo2 || !data.heartRate;
  const steps = data.steps ?? DEMO.steps;

  return (
    <MediScreen title="Health status" onBack={() => router.replace('/(tabs)/home')}>
      <View style={styles.stack}>
        <View>
          <SectionLabel title="COUNT STEPS" color={healthColors.stepsLabel} />
          <ChartCard left={26} right={32}>
            <BarChart
              values={steps}
              max={Math.max(10000, ...steps)}
              color={healthColors.stepsBar}
              labels={WEEK_LABELS}
            />
          </ChartCard>
        </View>

        <View>
          <SectionLabel title="OXYGEN IN BLOOD (Sp O2 %)" color={healthColors.spo2Label} />
          <ChartCard>
            <LineChart id="spo2" values={data.spo2 ?? DEMO.spo2} min={90} max={100} gradient={healthColors.spo2Line} />
          </ChartCard>
        </View>

        <View>
          <SectionLabel title="SLEEP TIME (HOURS)" color={healthColors.sleepLabel} />
          <ChartCard>
            <BarChart values={DEMO.sleep} max={10} color={healthColors.sleepBar} />
          </ChartCard>
        </View>

        <View>
          <SectionLabel title="HEART RATE (BPM)" color={healthColors.hrLabel} />
          <ChartCard>
            <LineChart
              id="hr"
              values={data.heartRate ?? DEMO.heartRate}
              min={50}
              max={110}
              gradient={healthColors.hrLine}
            />
          </ChartCard>
        </View>

        {usingDemo && <Text style={styles.note}>กราฟที่ยังไม่มีข้อมูลจากนาฬิกาแสดงเป็นข้อมูลตัวอย่าง</Text>}
      </View>
    </MediScreen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 40, marginTop: 14 },
  note: { textAlign: 'center', fontSize: 12, color: homeColors.textDim },
});
