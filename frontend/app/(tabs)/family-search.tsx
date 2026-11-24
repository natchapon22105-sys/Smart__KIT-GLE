import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GlassPanel } from '@/components/home/GlassPanel';
import { family, type FamilyRelation, type FamilySearchUser } from '@/services/family';
import { familyColors, homeColors, mediColors } from '@/theme/tokens';
import { notify } from '@/utils/notify';

const LABEL: Record<FamilyRelation, string> = { none: 'sent link', sent: 'sent', incoming: 'pending', linked: 'linked' };

/** Family Link → ค้นหาคนเพื่อส่งคำขอ (เฟรม Figma "search Username or Email") */
export default function FamilySearch() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<FamilySearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  // ค้นหาอัตโนมัติหลังหยุดพิมพ์ 300ms (≥ 2 ตัวอักษร)
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let active = true;
    const t = setTimeout(() => {
      family
        .search(term)
        .then((u) => active && setResults(u))
        .catch((e) => active && (setResults([]), notify('ค้นหาไม่สำเร็จ', e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')))
        .finally(() => active && setLoading(false));
    }, 300);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q]);

  const send = async (u: FamilySearchUser) => {
    setSending(u.username);
    try {
      await family.invite(u.username);
      setResults((rs) => rs.map((r) => (r.userId === u.userId ? { ...r, relation: 'sent' } : r)));
    } catch (e) {
      notify('ส่งคำขอไม่สำเร็จ', e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSending(null);
    }
  };

  const openProfile = (userId: number) =>
    router.push({ pathname: '/(tabs)/user/[userId]', params: { userId: String(userId) } });

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/family'));
  const term = q.trim();

  return (
    <View style={s.root}>
      <LinearGradient colors={homeColors.bg} style={StyleSheet.absoluteFill} />
      <AnimatedBackground color={homeColors.cell} />
      <View style={[s.col, { paddingTop: Math.max(insets.top + 8, 42), paddingBottom: Math.max(insets.bottom, 12) + 48 + 16 }]}>
        <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="ย้อนกลับ" style={s.back}>
          <Ionicons name="chevron-back" size={36} color="rgba(255,255,255,0.9)" />
        </Pressable>

        <GlassPanel radius={20} tint="rgba(255,255,255,0.16)" border="rgba(255,255,255,0.3)" style={s.search}>
          <TextInput
            value={q}
            onChangeText={setQ}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="search Username or Email"
            placeholderTextColor="rgba(255,255,255,0.75)"
            style={s.input}
          />
          {loading ? <ActivityIndicator color="#222" /> : <Ionicons name="search" size={24} color="rgba(30,40,35,0.7)" />}
        </GlassPanel>

        <GlassPanel radius={14} tint="rgba(255,255,255,0.12)" border="rgba(255,255,255,0.2)" style={s.panel}>
          <FlatList
            data={results}
            keyExtractor={(u) => String(u.userId)}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 10, gap: 10 }}
            ListEmptyComponent={
              // TODO(figma): ข้อความสถานะว่างไม่มีในดีไซน์
              <Text style={s.hint}>
                {term.length < 2 ? 'พิมพ์ชื่อผู้ใช้อย่างน้อย 2 ตัวอักษร หรืออีเมลแบบเต็ม' : loading ? '' : 'ไม่พบผู้ใช้'}
              </Text>
            }
            renderItem={({ item }) => {
              const can = item.relation === 'none';
              return (
                <GlassPanel radius={30} tint={familyColors.row} border={familyColors.rowBorder} style={s.row}>
                  <Pressable
                    onPress={() => openProfile(item.userId)}
                    accessibilityRole="button"
                    accessibilityLabel={`เปิดโปรไฟล์ ${item.displayName || item.username}`}
                    style={s.person}
                  >
                    <View style={s.avatar}>
                      {item.avatar ? (
                        <Image source={{ uri: item.avatar }} style={s.avatarImage} resizeMode="cover" />
                      ) : (
                        <Ionicons name="person" size={20} color="rgba(40,50,45,0.72)" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.name} numberOfLines={1}>{item.displayName || item.username}</Text>
                      <Text style={s.handle} numberOfLines={1}>@{item.username}</Text>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => send(item)}
                    disabled={!can || sending !== null}
                    accessibilityRole="button"
                    style={[s.btn, !can && s.btnOff]}
                  >
                    {sending === item.username ? <ActivityIndicator color="#111" /> : <Text style={s.btnText}>{LABEL[item.relation]}</Text>}
                  </Pressable>
                </GlassPanel>
              );
            }}
          />
        </GlassPanel>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#2B4837' },
  col: { flex: 1, width: '100%', maxWidth: 440, alignSelf: 'center' },
  back: {
    width: 62,
    height: 58,
    borderTopRightRadius: 29,
    borderBottomRightRadius: 29,
    backgroundColor: mediColors.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: { marginHorizontal: 24, marginTop: 8, height: 40, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 8 },
  input: { flex: 1, color: '#fff', fontSize: 12, outlineStyle: 'none' } as never,
  panel: { flex: 1, marginHorizontal: 20, marginTop: 12 },
  hint: { color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 24, fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 69, paddingVertical: 13, paddingHorizontal: 17, gap: 10 },
  person: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden', backgroundColor: '#D9D9D9', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%' },
  name: { color: '#fff', fontSize: 19, fontWeight: '800', lineHeight: 22 },
  handle: { color: 'rgba(255,255,255,0.5)', fontSize: 11, lineHeight: 13 },
  btn: { minWidth: 101, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#5CFF00' },
  btnOff: { backgroundColor: 'rgba(170,176,174,0.7)' },
  btnText: { color: '#000', fontWeight: '800', fontSize: 13 },
});
