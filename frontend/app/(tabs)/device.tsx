import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { MediScreen } from '@/components/medi/MediScreen';
import { GlassPanel } from '@/components/home/GlassPanel';
import { AccordionRow, Avatar } from '@/components/settings/SettingParts';
import { AccountInfo } from '@/components/settings/AccountInfo';
import { ReportApp } from '@/components/settings/ReportApp';
import { useAuth } from '@/services/auth/AuthContext';
import { settingColors } from '@/theme/tokens';

type Section = 'account' | 'report' | 'about' | null;

/**
 * Setting — ปุ่มขวาสุดของแถบเมนูล่าง (ตามเฟรม Figma "Setting")
 * Account info (ชื่อ/วันเกิด→อายุ/เพศ/ส่วนสูง/น้ำหนัก) · Report app · About app · LOG OUT
 * หมายเหตุ: ตั้งค่านาฬิกา (BLE) ยังไม่มีในดีไซน์ — ใช้ getBleService().applySettings() เมื่อมีดีไซน์
 */
export default function Setting() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState<Section>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const toggle = (k: Exclude<Section, null>) => setOpen((cur) => (cur === k ? null : k));

  const username = user?.username ?? 'UserName';

  return (
    <MediScreen title="Setting" onBack={() => router.replace('/(tabs)/home')}>
      <GlassPanel radius={22} tint={settingColors.panel} border={settingColors.panelBorder} style={s.panel}>
        <Avatar />
        <Text style={s.name} numberOfLines={1} adjustsFontSizeToFit>
          {displayName ?? username}
        </Text>
        <Text style={s.handle}>@{username}</Text>

        <View style={{ gap: 8, marginTop: 14 }}>
          <AccordionRow icon="person-circle-outline" title="Account info" open={open === 'account'} onToggle={() => toggle('account')}>
            <AccountInfo onSaved={(p) => setDisplayName(p.displayName)} />
          </AccordionRow>
          <AccordionRow icon="analytics-outline" title="Report app" open={open === 'report'} onToggle={() => toggle('report')}>
            <ReportApp />
          </AccordionRow>
          <AccordionRow icon="information-circle-outline" title="About app" open={open === 'about'} onToggle={() => toggle('about')}>
            {/* TODO(figma): เนื้อหา About ไม่มีในดีไซน์ — ข้อความชั่วคราว */}
            <Text style={s.about}>KIT - GLE · smart trinket</Text>
            <Text style={s.about}>เวอร์ชัน {Constants.expoConfig?.version ?? '-'}</Text>
            <Text style={s.about}>Make By : MAX</Text>
          </AccordionRow>
        </View>

        <Pressable onPress={logout} accessibilityRole="button" style={s.logout}>
          <Text style={s.logoutText}>LOG OUT</Text>
        </Pressable>
      </GlassPanel>
    </MediScreen>
  );
}

const s = StyleSheet.create({
  panel: { marginHorizontal: 22, paddingHorizontal: 10, paddingTop: 22, paddingBottom: 30, minHeight: 560 },
  name: { marginTop: 8, textAlign: 'center', fontSize: 36, fontWeight: '900', color: settingColors.name },
  handle: { textAlign: 'center', fontSize: 11, color: settingColors.handle },
  about: { color: 'rgba(255,255,255,0.85)', fontSize: 13, textAlign: 'center' },
  logout: { alignSelf: 'center', marginTop: 16, width: 140, height: 40, borderRadius: 20, backgroundColor: settingColors.logout, alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: '#fff', fontWeight: '900', fontSize: 14 },
});
