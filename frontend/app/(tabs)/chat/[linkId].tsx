import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GlassPanel } from '@/components/home/GlassPanel';
import { useAuth } from '@/services/auth/AuthContext';
import { chat, type ChatMessage } from '@/services/chat';
import { profileApi } from '@/services/profile';
import { homeColors, mediColors } from '@/theme/tokens';
import { pickSquareImage } from '@/utils/pickImage';
import { notify } from '@/utils/notify';

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const merged = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) merged.set(message.id, message);
  return [...merged.values()].sort((a, b) => a.id - b.id);
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MessageBubble({ message, mine, avatar }: { message: ChatMessage; mine: boolean; avatar: string | null }) {
  return (
    <View style={[styles.messageRow, mine && styles.messageRowMine]}>
      {!mine ? <MessageAvatar uri={avatar} /> : null}
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
        {message.imageData ? <Image source={{ uri: message.imageData }} style={styles.photo} resizeMode="cover" /> : null}
        {message.body ? <Text style={styles.bubbleText}>{message.body}</Text> : null}
        <Text style={styles.time}>{formatTime(message.createdAt)}</Text>
      </View>
      {mine ? <MessageAvatar uri={avatar} /> : null}
    </View>
  );
}

function MessageAvatar({ uri }: { uri: string | null }) {
  return (
    <View style={styles.smallAvatar}>
      {uri ? (
        <Image source={{ uri }} style={styles.smallAvatarImage} resizeMode="cover" />
      ) : (
        <Ionicons name="person" size={16} color="rgba(40,50,45,0.72)" />
      )}
    </View>
  );
}

export default function FamilyChatRoom() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ linkId: string; name?: string; userId?: string }>();
  const linkId = Number(params.linkId);
  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const userId = Number(params.userId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberAvatar, setMemberAvatar] = useState<string | null>(null);
  const [myAvatar, setMyAvatar] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const cursorRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    let active = true;
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      setMemberAvatar(null);
      setMyAvatar(null);
      return () => {
        active = false;
      };
    }

    const ownProfile = user?.id ? profileApi.getUser(user.id) : Promise.resolve(null);
    Promise.all([profileApi.getUser(userId), ownProfile])
      .then(([member, me]) => {
        if (!active) return;
        setMemberAvatar(member.avatar);
        setMyAvatar(me?.avatar ?? null);
      })
      .catch((e) => {
        if (active) notify('โหลดรูปโปรไฟล์ไม่สำเร็จ', e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
      });

    return () => {
      active = false;
    };
  }, [user?.id, userId]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let inFlight = false;
      cursorRef.current = undefined;
      setMessages([]);
      setError(null);
      if (!Number.isSafeInteger(linkId) || linkId <= 0) {
        setError('รหัสห้องแชทไม่ถูกต้อง');
        setLoading(false);
        return () => {
          active = false;
        };
      }

      const refresh = async (initial: boolean) => {
        if (inFlight) return;
        inFlight = true;
        if (initial) setLoading(true);
        try {
          const incoming = await chat.messages(linkId, initial ? undefined : cursorRef.current);
          if (!active) return;
          setMessages((current) => {
            const next = mergeMessages(initial ? [] : current, incoming);
            cursorRef.current = next.at(-1)?.id;
            return next;
          });
          if (initial) setError(null);
        } catch (e) {
          if (active && initial) setError(e instanceof Error ? e.message : 'โหลดข้อความไม่สำเร็จ');
        } finally {
          inFlight = false;
          if (active && initial) setLoading(false);
        }
      };

      void refresh(true);
      const timer = setInterval(() => void refresh(false), 5000);
      return () => {
        active = false;
        clearInterval(timer);
      };
    }, [linkId]),
  );

  useEffect(() => {
    if (messages.length) listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const send = async () => {
    const body = draft.trim();
    if ((!body && !selectedImage) || sending) return;
    setSending(true);
    try {
      const message = await chat.send(linkId, {
        ...(body ? { body } : {}),
        ...(selectedImage ? { imageData: selectedImage } : {}),
      });
      setMessages((current) => {
        const next = mergeMessages(current, [message]);
        cursorRef.current = next.at(-1)?.id;
        return next;
      });
      setDraft('');
      setSelectedImage(null);
    } catch (e) {
      notify('ส่งข้อความไม่สำเร็จ', e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSending(false);
    }
  };

  const chooseImage = async () => {
    try {
      setSelectedImage(await pickSquareImage());
    } catch (e) {
      notify('เลือกรูปไม่สำเร็จ', e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    }
  };

  const openProfile = () => {
    if (Number.isSafeInteger(userId) && userId > 0) {
      router.push({ pathname: '/(tabs)/user/[userId]', params: { userId: String(userId) } });
    }
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/chat'));

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <LinearGradient colors={homeColors.bg} style={StyleSheet.absoluteFill} />
      <AnimatedBackground color={homeColors.cell} />
      <View style={[styles.content, { paddingTop: Math.max(insets.top + 18, 68), paddingBottom: insets.bottom + 78 }]}>
        <View style={styles.header}>
          <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="ย้อนกลับ" style={styles.title}>
            <Ionicons name="chevron-back" size={34} color="rgba(255,255,255,0.9)" />
            <Text style={styles.titleText}>Chat For Family</Text>
          </Pressable>
        </View>

        <GlassPanel radius={18} tint="rgba(255,255,255,0.17)" border="rgba(255,255,255,0.3)" style={styles.panel}>
          <View style={styles.panelHeader}>
            <Pressable
              onPress={openProfile}
              disabled={!Number.isSafeInteger(userId) || userId <= 0}
              accessibilityRole="button"
              accessibilityLabel={`เปิดโปรไฟล์ ${name || 'Family member'}`}
              style={styles.headerPerson}
            >
              <View style={styles.avatar}>
                {memberAvatar ? (
                  <Image source={{ uri: memberAvatar }} style={styles.headerAvatarImage} resizeMode="cover" />
                ) : (
                  <Ionicons name="person" size={20} color="rgba(40,50,45,0.72)" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.personName} numberOfLines={1}>{name || 'Family member'}</Text>
                <Text style={styles.online}>Family Link</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => notify('ยังไม่รองรับ', 'การโทรด้วยเสียงยังไม่เปิดใช้งาน')}
              accessibilityRole="button"
              accessibilityLabel="โทรด้วยเสียง ยังไม่รองรับ"
              style={styles.call}
            >
              <Ionicons name="call" size={21} color="#101512" />
            </Pressable>
          </View>

          <View style={styles.conversation}>
            <View pointerEvents="none" style={styles.sideLine} />
            {loading ? (
              <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />
            ) : error ? (
              <Pressable onPress={() => router.replace('/(tabs)/chat')} style={styles.empty}>
                <Text style={styles.emptyText}>{error}</Text>
                <Text style={styles.retry}>กลับไปเลือกรายชื่อแล้วลองใหม่</Text>
              </Pressable>
            ) : (
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => {
                  const mine = item.senderId === user?.id;
                  return <MessageBubble message={item} mine={mine} avatar={mine ? myAvatar : memberAvatar} />;
                }}
                contentContainerStyle={styles.messageList}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={<Text style={styles.emptyText}>เริ่มส่งข้อความถึงครอบครัวได้เลย</Text>}
              />
            )}
          </View>

          {selectedImage ? (
            <View style={styles.previewRow}>
              <Image source={{ uri: selectedImage }} style={styles.preview} />
              <Text style={styles.previewText}>รูปภาพพร้อมส่ง</Text>
              <Pressable onPress={() => setSelectedImage(null)} accessibilityLabel="นำรูปออก">
                <Ionicons name="close-circle" size={23} color="#fff" />
              </Pressable>
            </View>
          ) : null}
          <View style={styles.composer}>
            <Pressable onPress={() => void chooseImage()} accessibilityRole="button" accessibilityLabel="แนบรูปภาพ">
              <Ionicons name="image-outline" size={24} color="rgba(255,255,255,0.9)" />
            </Pressable>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Aa"
              placeholderTextColor="rgba(40,48,44,0.55)"
              style={styles.input}
              multiline
              maxLength={2000}
              accessibilityLabel="พิมพ์ข้อความ"
            />
            {draft.trim() || selectedImage ? (
              <Pressable onPress={() => void send()} disabled={sending} accessibilityRole="button" accessibilityLabel="ส่งข้อความ">
                {sending ? <ActivityIndicator color="#fff" /> : <Ionicons name="send" size={22} color="#fff" />}
              </Pressable>
            ) : (
              <Pressable
                onPress={() => notify('ยังไม่รองรับ', 'การส่งข้อความเสียงยังไม่เปิดใช้งาน')}
                accessibilityRole="button"
                accessibilityLabel="บันทึกเสียง ยังไม่รองรับ"
              >
                <Ionicons name="mic" size={25} color="rgba(255,255,255,0.9)" />
              </Pressable>
            )}
          </View>
        </GlassPanel>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#2B4837' },
  content: { flex: 1, width: '100%', maxWidth: 440, alignSelf: 'center', paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: {
    alignSelf: 'flex-start',
    height: 54,
    paddingLeft: 8,
    paddingRight: 20,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: mediColors.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  titleText: { color: 'rgba(255,255,255,0.92)', fontWeight: '800', fontSize: 19 },
  panel: { flex: 1, padding: 10, paddingBottom: 8 },
  panelHeader: { minHeight: 55, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  headerPerson: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#D9D9D9', alignItems: 'center', justifyContent: 'center' },
  headerAvatarImage: { width: '100%', height: '100%', borderRadius: 19 },
  personName: { color: '#fff', fontSize: 14, fontWeight: '800' },
  online: { color: 'rgba(255,255,255,0.62)', fontSize: 10, marginTop: 2 },
  call: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#0A0D0B', alignItems: 'center', justifyContent: 'center' },
  conversation: { flex: 1, marginTop: 3, marginBottom: 8, overflow: 'hidden' },
  sideLine: { position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.55)' },
  messageList: { flexGrow: 1, justifyContent: 'flex-end', paddingLeft: 8, paddingRight: 1, paddingVertical: 8, gap: 14 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 7, maxWidth: '92%' },
  messageRowMine: { alignSelf: 'flex-end' },
  smallAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#D9D9D9', alignItems: 'center', justifyContent: 'center' },
  smallAvatarImage: { width: '100%', height: '100%', borderRadius: 15 },
  bubble: { maxWidth: '82%', minWidth: 72, borderRadius: 14, paddingHorizontal: 11, paddingTop: 9, paddingBottom: 6 },
  bubbleOther: { backgroundColor: 'rgba(190,198,195,0.78)', borderTopLeftRadius: 5 },
  bubbleMine: { backgroundColor: 'rgba(190,198,195,0.9)', borderTopRightRadius: 5 },
  bubbleText: { color: '#1F2923', fontSize: 14, lineHeight: 19 },
  time: { color: 'rgba(35,45,39,0.58)', fontSize: 9, textAlign: 'right', marginTop: 4 },
  photo: { width: 176, height: 176, borderRadius: 9, marginBottom: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  emptyText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', alignSelf: 'center', marginTop: 12 },
  retry: { color: '#fff', fontWeight: '800', fontSize: 12, marginTop: 8 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 7, paddingBottom: 7 },
  preview: { width: 36, height: 36, borderRadius: 6 },
  previewText: { flex: 1, color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  composer: {
    minHeight: 42,
    borderRadius: 22,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(190,196,194,0.82)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: { flex: 1, maxHeight: 88, minHeight: 34, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7, color: '#202622', fontSize: 14, outlineStyle: 'none' } as never,
});
