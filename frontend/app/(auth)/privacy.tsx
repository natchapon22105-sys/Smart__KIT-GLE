import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthShell } from '@/components/auth/AuthShell';
import { GradientButton } from '@/components/auth/GradientButton';
import { useAuth } from '@/services/auth/AuthContext';
import { PRIVACY_SECTIONS } from '@/content/privacyPolicy';
import { authColors } from '@/theme/tokens';

export default function Privacy() {
  const router = useRouter();
  const { setPrivacyAccepted } = useAuth();

  const confirm = () => {
    setPrivacyAccepted(true);
    if (router.canGoBack()) router.back();
    else router.replace('/(auth)/sign-up');
  };

  return (
    <AuthShell variant="compact">
      <Text style={styles.heading}>Privacy Policy : PDPA</Text>
      <View style={styles.rule} />

      <View style={styles.body}>
        {PRIVACY_SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
      </View>

      <GradientButton label="Confirm" onPress={confirm} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 18, fontWeight: '800', color: authColors.text },
  rule: { height: 1, backgroundColor: '#C9C9C9', marginTop: 12 },
  body: { marginTop: 16, marginBottom: 24 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: authColors.text },
  sectionBody: { marginTop: 3, fontSize: 13, lineHeight: 19, color: '#4A4A4A' },
});
