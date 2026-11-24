import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from '@/components/home/GlassPanel';
import { MediScreen } from '@/components/medi/MediScreen';
import { ageFromBirthDate, profileApi, type PublicProfile } from '@/services/profile';

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function HealthItem({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.healthItem}>
      <Ionicons name={icon} size={20} color="#DFFFE5" />
      <Text style={styles.healthValue}>{value}</Text>
      <Text style={styles.healthLabel}>{label}</Text>
    </View>
  );
}

export default function UserProfileScreen() {
  const router = useRouter();
  const { userId: rawUserId } = useLocalSearchParams<{ userId: string }>();
  const userId = Number(rawUserId);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!Number.isSafeInteger(userId) || userId <= 0) {
        setProfile(null);
        setError('รหัสผู้ใช้ไม่ถูกต้อง');
        setLoading(false);
        return () => {
          active = false;
        };
      }

      setLoading(true);
      setError(null);
      profileApi
        .getUser(userId)
        .then((result) => active && setProfile(result))
        .catch((e) => active && setError(e instanceof Error ? e.message : 'โหลดโปรไฟล์ไม่สำเร็จ'))
        .finally(() => active && setLoading(false));

      return () => {
        active = false;
      };
    }, [retry, userId]),
  );
  const age = profile ? ageFromBirthDate(profile.birthDate) : null;

  return (
    <MediScreen
      title="User Profile"
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}
    >
      {loading ? <ActivityIndicator color="#fff" style={{ marginTop: 32 }} /> : null}
      {error ? (
        <Pressable onPress={() => setRetry((value) => value + 1)} style={styles.state}>
          <Text style={styles.stateText}>{error}</Text>
          <Text style={styles.retry}>แตะเพื่อลองใหม่</Text>
        </Pressable>
      ) : null}
      {profile ? (
        <View style={styles.content}>
          <GlassPanel
            radius={24}
            tint="rgba(255,255,255,0.14)"
            border="rgba(255,255,255,0.28)"
            style={styles.card}
          >
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                {profile.avatar ? (
                  <Image source={{ uri: profile.avatar }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <Ionicons name="person" size={48} color="rgba(40,50,45,0.68)" />
                )}
              </View>
              {profile.watchConnected && profile.canViewHealth ? (
                <View style={styles.watchBadge} accessibilityLabel="เชื่อมต่อกับนาฬิกาอยู่">
                  <Ionicons name="watch" size={16} color="#fff" />
                </View>
              ) : null}
            </View>
            <Text style={styles.name}>{profile.displayName || profile.username}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
          </GlassPanel>

          <GlassPanel radius={22} tint="rgba(255,255,255,0.12)" border="rgba(255,255,255,0.24)" style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="person-circle-outline" size={21} color="#fff" />
              <Text style={styles.sectionTitle}>Account info</Text>
            </View>
            <View style={styles.infoGrid}>
              <InfoItem label="อายุ" value={age != null ? `${age} ปี` : 'ไม่ระบุ'} />
              <InfoItem label="ส่วนสูง" value={profile.heightCm != null ? `${profile.heightCm} ซม.` : 'ไม่ระบุ'} />
              <InfoItem label="น้ำหนัก" value={profile.weightKg != null ? `${profile.weightKg} กก.` : 'ไม่ระบุ'} />
            </View>
          </GlassPanel>

          {profile.medicationStatus ? (
            <GlassPanel radius={22} tint="rgba(255,255,255,0.12)" border="rgba(255,255,255,0.24)" style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="medkit-outline" size={21} color="#fff" />
                <Text style={styles.sectionTitle}>MediRemind วันนี้</Text>
                <View style={styles.summaryPill}>
                  <Text style={styles.summaryText}>{profile.medicationStatus.taken}/{profile.medicationStatus.items.length}</Text>
                </View>
              </View>
              {profile.medicationStatus.items.length ? profile.medicationStatus.items.map((item, index) => (
                <View key={`${item.name}-${item.timeOfDay}-${index}`} style={styles.medRow}>
                  <View style={styles.medIcon}>
                    <Ionicons name="medical-outline" size={18} color="#173528" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medName}>{item.name}</Text>
                    <Text style={styles.medTime}>{item.timeOfDay} น.</Text>
                  </View>
                  <Text style={[styles.statusText, item.status === 'taken' ? styles.statusTaken : item.status === 'missed' ? styles.statusMissed : undefined]}>
                    {item.status === 'taken' ? 'กินแล้ว' : item.status === 'missed' ? 'พลาดแล้ว' : item.status === 'skipped' ? 'ข้าม' : 'รอรับประทาน'}
                  </Text>
                </View>
              )) : <Text style={styles.emptyText}>วันนี้ไม่มีรายการยา</Text>}
            </GlassPanel>
          ) : null}

          {profile.watchConnected ? (
            <GlassPanel radius={22} tint="rgba(255,255,255,0.12)" border="rgba(255,255,255,0.24)" style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="fitness-outline" size={21} color="#fff" />
                <Text style={styles.sectionTitle}>Health status</Text>
              </View>
              {profile.healthStatus ? (
                <View style={styles.healthGrid}>
                  <HealthItem icon="heart" label="Heart rate" value={profile.healthStatus.heartRate != null ? `${profile.healthStatus.heartRate} BPM` : '-'} />
                  <HealthItem icon="pulse" label="SpO2" value={profile.healthStatus.spo2 != null ? `${profile.healthStatus.spo2}%` : '-'} />
                  <HealthItem icon="footsteps" label="Steps" value={profile.healthStatus.steps != null ? `${profile.healthStatus.steps}` : '-'} />
                  <HealthItem icon="thermometer" label="Temp" value={profile.healthStatus.temperature != null ? `${profile.healthStatus.temperature}°C` : '-'} />
                </View>
              ) : (
                <Text style={styles.emptyText}>เชื่อมต่อนาฬิกาแล้ว รอข้อมูลสุขภาพล่าสุด</Text>
              )}
            </GlassPanel>
          ) : null}
        </View>
      ) : null}
    </MediScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingHorizontal: 22 },
  card: { alignItems: 'center', marginHorizontal: 30, paddingVertical: 28, paddingHorizontal: 20 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    overflow: 'hidden',
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  avatarImage: { width: '100%', height: '100%' },
  watchBadge: {
    position: 'absolute',
    right: -2,
    bottom: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1AAE68',
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', marginTop: 16 },
  username: { color: 'rgba(255,255,255,0.65)', fontSize: 14, marginTop: 5 },
  section: { paddingHorizontal: 16, paddingVertical: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '900' },
  infoGrid: { flexDirection: 'row', gap: 8 },
  infoItem: {
    flex: 1,
    minHeight: 68,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  infoLabel: { color: 'rgba(255,255,255,0.58)', fontSize: 11, marginBottom: 5 },
  infoValue: { color: '#fff', fontSize: 14, fontWeight: '800' },
  summaryPill: { borderRadius: 12, paddingHorizontal: 9, height: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(27,242,27,0.18)' },
  summaryText: { color: '#1BF21B', fontSize: 12, fontWeight: '900' },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingVertical: 10 },
  medIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DFFFE5' },
  medName: { color: '#fff', fontSize: 14, fontWeight: '800' },
  medTime: { color: 'rgba(255,255,255,0.58)', fontSize: 12, marginTop: 2 },
  statusText: { color: '#D8E2DC', fontSize: 11, fontWeight: '800' },
  statusTaken: { color: '#68E893' },
  statusMissed: { color: '#FFB4AB' },
  emptyText: { color: 'rgba(255,255,255,0.68)', fontSize: 12, textAlign: 'center', paddingVertical: 8 },
  healthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  healthItem: {
    width: '48%',
    flexGrow: 1,
    minHeight: 82,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthValue: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 3 },
  healthLabel: { color: 'rgba(255,255,255,0.58)', fontSize: 11, marginTop: 2 },
  state: { alignItems: 'center', padding: 18 },
  stateText: { color: '#FFB4AB', textAlign: 'center' },
  retry: { color: '#fff', fontWeight: '800', marginTop: 8 },
});
