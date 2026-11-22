import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MediScreen } from '@/components/medi/MediScreen';
import { AddButton, EmptyFamily, GroupLabel, PersonRow } from '@/components/family/FamilyParts';
import { family, type FamilyLinks, type FamilyPerson } from '@/services/family';
import { familyColors } from '@/theme/tokens';
import { notify } from '@/utils/notify';

/** Family Link — เพิ่ม/รอตอบรับ/เชื่อมต่อแล้ว (ตามเฟรม Figma 3 สถานะ) */
export default function Family() {
  const router = useRouter();
  const [data, setData] = useState<FamilyLinks | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await family.links());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ');
      setData((p) => p ?? { waiting: [], incoming: [], connected: [] });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      await load();
    } catch (e) {
      notify('ทำรายการไม่สำเร็จ', e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    }
  };

  const confirmUnlink = (p: FamilyPerson) => {
    const go = () => void run(() => family.remove(p.id));
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(`ยกเลิกการเชื่อมต่อกับ @${p.username}?`)) go();
      return;
    }
    Alert.alert('UN-LINK', `ยกเลิกการเชื่อมต่อกับ @${p.username} ใช่ไหม`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'UN-LINK', style: 'destructive', onPress: go },
    ]);
  };

  const connected = data?.connected ?? [];
  const waiting = data?.waiting ?? [];
  const incoming = data?.incoming ?? [];

  return (
    <MediScreen title="Family Link" onBack={() => router.replace('/(tabs)/home')}>
      <AddButton onPress={() => router.push('/(tabs)/family-search')} />

      {data === null && <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />}
      {error && (
        <Pressable onPress={load} style={{ alignItems: 'center', padding: 12 }}>
          <Text style={{ color: '#FFB4AB', textAlign: 'center' }}>{error}</Text>
          <Text style={{ color: '#fff', fontWeight: '700' }}>แตะเพื่อลองใหม่</Text>
        </Pressable>
      )}

      {data && connected.length === 0 && <EmptyFamily />}

      {/* TODO(figma): กลุ่ม "คำขอที่ส่งมาหาฉัน" ไม่มีในดีไซน์ — เพิ่มเพื่อให้ฝั่งผู้รับตอบรับได้ */}
      {incoming.length > 0 && (
        <>
          <GroupLabel color={familyColors.connect} text="REQUESTS" />
          <View style={{ gap: 10 }}>
            {incoming.map((p) => (
              <PersonRow
                key={p.id}
                person={p}
                actions={[
                  { text: 'Accept', kind: 'accept', onPress: () => void run(() => family.respond(p.id, true)) },
                  { text: 'Decline', kind: 'decline', onPress: () => void run(() => family.respond(p.id, false)) },
                ]}
              />
            ))}
          </View>
        </>
      )}

      {waiting.length > 0 && (
        <>
          <GroupLabel color={familyColors.waiting} text="WAITING FOR REPLY" />
          <View style={{ gap: 10 }}>
            {waiting.map((p) => (
              <PersonRow key={p.id} person={p} actions={[{ text: 'Cancel', kind: 'cancel', onPress: () => void run(() => family.remove(p.id)) }]} />
            ))}
          </View>
        </>
      )}

      {connected.length > 0 && (
        <>
          <GroupLabel color={familyColors.connect} text="CONNECT FAMILY" />
          <View style={{ gap: 10 }}>
            {connected.map((p) => (
              <PersonRow key={p.id} person={p} actions={[{ text: 'UN-LINK', kind: 'unlink', onPress: () => confirmUnlink(p) }]} />
            ))}
          </View>
        </>
      )}

    </MediScreen>
  );
}
