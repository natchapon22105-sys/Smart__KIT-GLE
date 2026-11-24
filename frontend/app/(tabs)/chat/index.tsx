import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GlassPanel } from '@/components/home/GlassPanel';
import { family } from '@/services/family';
import type { FamilyConnected } from '@/services/family';
import { homeColors, mediColors } from '@/theme/tokens';

export default function ChatList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [people, setPeople] = useState<FamilyConnected[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPeople((await family.links()).connected);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดรายชื่อไม่สำเร็จ');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openChat = (person: FamilyConnected) =>
    router.push({
      pathname: '/(tabs)/chat/[linkId]',
      params: { linkId: String(person.id), name: person.displayName || person.username, userId: String(person.userId) },
    });

  const openProfile = (person: FamilyConnected) =>
    router.push({ pathname: '/(tabs)/user/[userId]', params: { userId: String(person.userId) } });

  return (
    <View style={styles.root}>
      <LinearGradient colors={homeColors.bg} style={StyleSheet.absoluteFill} />
      <AnimatedBackground color={homeColors.cell} />
      <View style={[styles.content, { paddingTop: Math.max(insets.top + 24, 82), paddingBottom: insets.bottom + 94 }]}>
        <Pressable onPress={() => router.replace('/(tabs)/home')} accessibilityRole="button" style={styles.title}>
          <Ionicons name="chevron-back" size={34} color="rgba(255,255,255,0.9)" />
          <Text style={styles.titleText}>Chat For Family</Text>
        </Pressable>

        <GlassPanel radius={18} tint="rgba(255,255,255,0.16)" border="rgba(255,255,255,0.3)" style={styles.panel}>
          <Text style={styles.heading}>เลือกสมาชิกครอบครัว</Text>
          {people === null && !error ? <ActivityIndicator color="#fff" style={{ marginTop: 24 }} /> : null}
          {error ? (
            <Pressable onPress={() => void load()} style={styles.center}>
              <Text style={styles.message}>{error}</Text>
              <Text style={styles.retry}>แตะเพื่อลองใหม่</Text>
            </Pressable>
          ) : null}
          {people?.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="people-outline" size={46} color="rgba(255,255,255,0.55)" />
              <Text style={styles.message}>ต้องเชื่อมต่อ Family Link ก่อนจึงจะเริ่มแชทได้</Text>
              <Pressable onPress={() => router.push('/(tabs)/family')} style={styles.familyButton}>
                <Text style={styles.familyButtonText}>ไปที่ Family Link</Text>
              </Pressable>
            </View>
          ) : null}
          {people?.map((person) => (
            <View key={person.id} style={styles.person}>
              <Pressable
                onPress={() => openProfile(person)}
                accessibilityRole="button"
                accessibilityLabel={`เปิดโปรไฟล์ ${person.displayName || person.username}`}
                style={styles.personInfo}
              >
                <View style={styles.avatar}>
                  {person.avatar ? (
                    <Image source={{ uri: person.avatar }} style={styles.avatarImage} resizeMode="cover" />
                  ) : (
                    <Ionicons name="person" size={22} color="rgba(40,50,45,0.72)" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>{person.displayName || person.username}</Text>
                  <Text style={styles.handle} numberOfLines={1}>@{person.username}</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => openChat(person)}
                accessibilityRole="button"
                accessibilityLabel={`แชทกับ ${person.displayName || person.username}`}
                style={styles.chatButton}
              >
                <Ionicons name="chatbubble-ellipses" size={24} color="#E4ECE6" />
              </Pressable>
            </View>
          ))}
        </GlassPanel>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#2B4837' },
  content: { flex: 1, width: '100%', maxWidth: 440, alignSelf: 'center', paddingHorizontal: 20 },
  title: {
    alignSelf: 'flex-start',
    height: 58,
    paddingHorizontal: 12,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    backgroundColor: mediColors.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 17,
  },
  titleText: { color: 'rgba(255,255,255,0.92)', fontWeight: '800', fontSize: 20 },
  panel: { flex: 1, padding: 16 },
  heading: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700', marginBottom: 12 },
  person: {
    minHeight: 68,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.13)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  personInfo: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  chatButton: { width: 38, height: 42, alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 21 },
  name: { color: '#fff', fontSize: 16, fontWeight: '800' },
  handle: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2 },
  center: { alignItems: 'center', padding: 20 },
  message: { color: 'rgba(255,255,255,0.78)', fontSize: 13, textAlign: 'center', marginTop: 8 },
  retry: { color: '#fff', fontWeight: '800', marginTop: 8 },
  familyButton: { backgroundColor: homeColors.connect, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 9, marginTop: 14 },
  familyButtonText: { color: '#111', fontWeight: '800', fontSize: 13 },
});
