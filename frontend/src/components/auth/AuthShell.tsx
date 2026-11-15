import React from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { AnimatedBackground } from '../AnimatedBackground';
import { authColors, colors, fonts } from '@/theme/tokens';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const HERO = require('../../../assets/images/auth-hero.jpg');

/**
 * โครงหน้า Auth ตาม Figma: รูปด้านบน (มืดลง + เซลล์ลอย) แล้วการ์ดเทาโค้งทับขึ้นมาด้านล่าง
 * variant "full"    = หน้า Sign In (ข้อความต้อนรับ + KIT- GLE + smart trinket)
 * variant "compact" = หน้า Sign Up / Privacy (มีแค่ KIT- GLE)
 */
// ข้อความต้อนรับ (1 ข้อความในวงเล็บ = 1 บรรทัด) — Figma เดิมสะกด "WLECOM" / "T" / "O" แก้เป็น "WELCOME TO" แล้ว
const WELCOME_LINES = ['WELCOME TO'];

export function AuthShell({ variant, children }: { variant: 'full' | 'compact'; children: React.ReactNode }) {
  const { height: winH } = useWindowDimensions();
  const heroH = variant === 'full' ? Math.max(winH * 0.47, 380) : 150;
  const overlap = 40;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={{ height: heroH }}>
          <ImageBackground source={HERO} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: authColors.heroOverlay }]} />
          <AnimatedBackground height={heroH} />

          <View style={[styles.heroContent, variant === 'compact' && styles.heroContentCompact]}>
            {variant === 'full' && WELCOME_LINES.map((l) => (
              <Text key={l} style={styles.welcome}>{l}</Text>
            ))}
            <Text style={[styles.brand, variant === 'compact' && styles.brandCompact]}>KIT- GLE</Text>
            {variant === 'full' && (
              <>
                <Text style={styles.subtitle}>smart trinket</Text>
                <Text style={styles.tagline}>
                  New of trinket in lifestyle has{'\n'}new for option Make By : MAX
                </Text>
              </>
            )}
          </View>
        </View>

        <View style={[styles.card, { marginTop: -overlap, minHeight: winH - heroH + overlap }]}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDark },
  heroContent: { ...StyleSheet.absoluteFill, alignItems: 'center', paddingTop: 48 },
  heroContentCompact: { justifyContent: 'center', paddingTop: 0, paddingBottom: 30 },
  welcome: { fontSize: 34, lineHeight: 42, fontWeight: '800', color: colors.white },
  brand: { fontSize: 58, lineHeight: 64, fontWeight: '900', color: authColors.brandGreen, letterSpacing: 1 },
  brandCompact: { fontSize: 50, lineHeight: 56 },
  subtitle: { fontSize: 22, color: colors.white, marginTop: 4 },
  tagline: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 16,
    color: colors.whiteSoft,
    textAlign: 'center',
    fontFamily: fonts.mono,
  },
  card: {
    flexGrow: 1,
    backgroundColor: authColors.card,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 30,
    paddingTop: 26,
    paddingBottom: 36,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 520,
  },
});
