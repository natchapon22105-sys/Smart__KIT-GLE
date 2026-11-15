import React from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Logo } from '@/components/Logo';
import { ProfileHeader } from '@/components/home/ProfileHeader';
import { WatchCard } from '@/components/home/WatchCard';
import { FeatureGrid } from '@/components/home/FeatureGrid';
import { useAuth } from '@/services/auth/AuthContext';
import { useWatch } from '@/hooks/useWatch';
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

  const logoSize = Math.min(width, 520) * 0.92;

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
            onMedi={() => router.push('/(tabs)/medi-remind')}
            onHealth={() => router.push('/(tabs)/health')}
            onChat={() => notify('ยังไม่เปิดใช้งาน', 'ฟีเจอร์ Chat for family ยังไม่เปิดให้ใช้งานในเวอร์ชันนี้')}
            onFamily={() => router.push('/(tabs)/family')}
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
