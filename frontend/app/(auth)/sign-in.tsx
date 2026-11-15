import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { AuthShell } from '@/components/auth/AuthShell';
import { TextField } from '@/components/auth/TextField';
import { GradientButton } from '@/components/auth/GradientButton';
import { SocialRow } from '@/components/auth/SocialRow';
import { useAuth } from '@/services/auth/AuthContext';
import { notify } from '@/utils/notify';
import { authColors } from '@/theme/tokens';

export default function SignIn() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const submit = async () => {
    if (busy) return;
    if (!identifier.trim() || !password) {
      setError('กรุณากรอกอีเมล/ชื่อผู้ใช้ และรหัสผ่าน');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await login(identifier.trim(), password);
      // สำเร็จ → (auth)/_layout จะ Redirect ไปหน้าหลักเอง
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell variant="full">
      <Text style={styles.title}>SIGN IN</Text>

      <TextField
        value={identifier}
        onChangeText={setIdentifier}
        placeholder="Enter email or user name"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextField
        inputRef={passwordRef}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secure
        autoCapitalize="none"
        autoComplete="current-password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      {error ? <Text style={styles.error}>{error}</Text> : <View style={{ height: 14 }} />}

      <GradientButton label="Login" onPress={submit} loading={busy} />

      <Text style={styles.switchText}>
        Don't have an account?{' '}
        <Link href="/(auth)/sign-up" style={styles.link}>
          Register HERE!
        </Link>
      </Text>

      <SocialRow
        onPress={(p) => notify('ยังไม่เปิดใช้งาน', `การเข้าสู่ระบบด้วย ${p === 'google' ? 'Google' : 'Facebook'} ยังไม่เปิดให้ใช้งานในเวอร์ชันนี้`)}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  title: { textAlign: 'center', fontSize: 34, fontWeight: '900', color: authColors.brandGreen },
  error: { marginTop: 12, marginBottom: 2, textAlign: 'center', color: authColors.error, fontSize: 13 },
  switchText: { marginTop: 18, textAlign: 'center', fontSize: 14, fontWeight: '800', color: authColors.text },
  link: { color: authColors.brandGreen, fontWeight: '800' },
});
