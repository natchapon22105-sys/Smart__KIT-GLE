import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Logo } from '@/components/Logo';
import { ProfileHeader } from '@/components/home/ProfileHeader';
import { WatchCard } from '@/components/home/WatchCard';
import { FeatureGrid } from '@/components/home/FeatureGrid';
import { useAuth } from '@/services/auth/AuthContext';
import { useWatch } from '@/hooks/useWatch';
import {
  formatLocalDate,
  getMedicationDoseStatus,
  getNextMedicationDose,
  medications,
  type MedicationDoseLog,
} from '@/services/medications';
import { family } from '@/services/family';
import { profileApi } from '@/services/profile';
import { notify } from '@/utils/notify';
import { homeColors } from '@/theme/tokens';

// ข้อความเวอร์ชันตามที่แสดงใน Figma — TODO: ผูกกับเวอร์ชันแอปจริงเมื่อกำหนดรูปแบบเลขเวอร์ชันแล้ว
const VERSION_LABEL = '10.02.001';

/** หน้าหลัก — ตามเฟรม Figma "KIT-GLE-main" */
export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { user } = useAuth();
  const watch = useWatch();
  const [medicationList, setMedicationList] = useState<Awaited<ReturnType<typeof medications.list>> | null>(null);
  const [doseLogs, setDoseLogs] = useState<MedicationDoseLog[] | null>(null);
  const [medicationError, setMedicationError] = useState(false);
  const [doseStatusSaving, setDoseStatusSaving] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [familyInfo, setFamilyInfo] = useState<{ incoming: number; connected: number } | null>(null);

  const logoSize = Math.min(width, 520) * 0.92;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setMedicationError(false);
      setMedicationList(null);
      setDoseLogs(null);
      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      setNow(start);
      void Promise.all([
        medications.list(),
        medications.listDoseLogs(formatLocalDate(start), formatLocalDate(end)),
      ])
        .then(([items, logs]) => {
          if (active) {
            setMedicationList(items);
            setDoseLogs(logs);
          }
        })
        .catch(() => {
          if (active) setMedicationError(true);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  // รูปโปรไฟล์ (เปลี่ยนได้ที่หน้า Setting) — โหลดใหม่ทุกครั้งที่กลับมาหน้านี้
  useFocusEffect(
    useCallback(() => {
      let active = true;
      profileApi
        .get()
        .then((p) => active && setAvatarUri(p.avatar))
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, []),
  );

  // แจ้งเตือน Family Link: จำนวนคำขอที่รอตอบ + คนที่เชื่อมแล้ว (โหลดใหม่ทุกครั้งที่กลับมาหน้านี้)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      family
        .links()
        .then((l) => active && setFamilyInfo({ incoming: l.incoming.length, connected: l.connected.length }))
        .catch(() => active && setFamilyInfo(null));
      return () => {
        active = false;
      };
    }, []),
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const nextDose = useMemo(
    () => (medicationList && doseLogs ? getNextMedicationDose(medicationList, doseLogs, now) : null),
    [doseLogs, medicationList, now],
  );
  const doseStatus = useMemo(
    () => (nextDose && doseLogs ? getMedicationDoseStatus(nextDose, doseLogs) : null),
    [doseLogs, nextDose],
  );

  const toggleDoseStatus = useCallback(async () => {
    if (!nextDose || !doseLogs || !doseStatus || doseStatusSaving) return;
    setDoseStatusSaving(true);
    try {
      const nextStatus = doseStatus === 'taken' ? 'pending' : 'taken';
      const log = await medications.setDoseStatus(nextDose, nextStatus);
      setDoseLogs((current) =>
        current
          ? [
              ...current.filter(
                (item) =>
                  item.scheduleId !== log.scheduleId || item.scheduledAt !== log.scheduledAt,
              ),
              log,
            ]
          : [log],
      );
    } catch (e) {
      notify('บันทึกสถานะไม่สำเร็จ', e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    } finally {
      setDoseStatusSaving(false);
    }
  }, [doseLogs, doseStatus, doseStatusSaving, nextDose]);

  return (
    <View style={styles.root}>
      <LinearGradient colors={homeColors.bg} style={StyleSheet.absoluteFill} />
      <AnimatedBackground color={homeColors.cell} />

      {/* โลโก้จางเป็นลายน้ำหลังการ์ดนาฬิกา (ตามดีไซน์) — เปลี่ยนที่ assets/images/logo.png */}
      <View
        pointerEvents="none"
        style={[styles.watermark, { top: Math.max(height * 0.6 - logoSize / 2, 0) }]}
      >
        <Logo size={logoSize} style={{ opacity: 0.16 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.column}>
          <ProfileHeader
            username={user?.username ?? 'UserName'}
            active={watch.connected}
            version={VERSION_LABEL}
            onAddFamily={() => router.push('/(tabs)/family')}
            avatarUri={avatarUri}
          />

          <View style={styles.gap} />
          <WatchCard
            connected={watch.connected}
            busy={watch.busy}
            state={watch.state}
            error={watch.error}
            isMock={watch.isMock}
            onConnect={watch.connect}
            onDisconnect={watch.disconnect}
          />

          <View style={styles.gap} />
          <FeatureGrid
            steps={watch.health?.steps ?? 0}
            spo2={watch.health?.spo2 ?? 0}
            nextDose={nextDose}
            doseStatus={doseStatus}
            doseStatusSaving={doseStatusSaving}
            medicationLoading={medicationList === null || doseLogs === null}
            medicationError={medicationError}
            now={now}
            onToggleDoseStatus={toggleDoseStatus}
            onMedi={() => router.push('/(tabs)/medi-remind')}
            onHealth={() => router.push('/(tabs)/health')}
            onChat={() => router.push('/(tabs)/chat')}
            onFamily={() => router.push('/(tabs)/family')}
            familyIncoming={familyInfo?.incoming ?? 0}
            familyConnected={familyInfo?.connected ?? null}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#2A4636' },
  watermark: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  // เผื่อพื้นที่ด้านล่างให้แถบเมนูลอย (สูงประมาณ 48 + ขอบ)
  scroll: { paddingBottom: 110, paddingHorizontal: 22, alignItems: 'center' },
  column: { width: '100%', maxWidth: 440 },
  gap: { height: 22 },
});
