import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { AuthShell } from '@/components/auth/AuthShell';
import { TextField } from '@/components/auth/TextField';
import { GradientButton } from '@/components/auth/GradientButton';
import { SocialRow } from '@/components/auth/SocialRow';
import { useAuth } from '@/services/auth/AuthContext';
import { notify } from '@/utils/notify';
import { authColors } from '@/theme/tokens';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_.]{3,30}$/;

type Errors = Partial<Record<'email' | 'username' | 'password' | 'confirm' | 'privacy', string>>;

export default function SignUp() {
  const router = useRouter();
  const { register, privacyAccepted } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const userRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const passRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const confirmRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!EMAIL_RE.test(email.trim())) e.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    if (!USERNAME_RE.test(username.trim().toLowerCase())) e.username = 'ใช้ a-z 0-9 _ . ยาว 3-30 ตัว';
    if (password.length < 8) e.password = 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร';
    else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) e.password = 'ต้องมีทั้งตัวอักษรและตัวเลข';
    if (confirm !== password) e.confirm = 'รหัสผ่านไม่ตรงกัน';
    if (!privacyAccepted) e.privacy = 'กรุณาอ่านและยอมรับ Privacy Policy';
    return e;
  };

  const submit = async () => {
    if (busy) return;
    const e = validate();
    setErrors(e);
    setServerError(null);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await register({ email: email.trim(), username: username.trim().toLowerCase(), password });
      // สำเร็จ → ได้ล็อกอินทันที แล้ว (auth)/_layout จะพาไปหน้าหลัก
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'สมัครสมาชิกไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell variant="compact">
      <Text style={styles.heading}>
        If you already have an account{'\n'}register You can{' '}
        <Link href="/(auth)/sign-in" style={styles.link}>
          Login here!
        </Link>
      </Text>
      <View style={styles.rule} />

      <TextField
        value={email}
        onChangeText={setEmail}
        placeholder="Enter email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        returnKeyType="next"
        onSubmitEditing={() => userRef.current?.focus()}
        error={errors.email}
      />
      <TextField
        inputRef={userRef}
        value={username}
        onChangeText={setUsername}
        placeholder="Create Username"
        autoCapitalize="none"
        autoComplete="username-new"
        returnKeyType="next"
        onSubmitEditing={() => passRef.current?.focus()}
        error={errors.username}
      />
      <TextField
        inputRef={passRef}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        error={errors.password}
      />
      <TextField
        inputRef={confirmRef}
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Confirm Password"
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        returnKeyType="go"
        onSubmitEditing={submit}
        error={errors.confirm}
      />

      <View style={{ height: 26 }} />
      <GradientButton label="Sign Up" onPress={submit} loading={busy} />

      {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

      {/* Privacy Policy : PDPA — กดเพื่อไปอ่านและกด Confirm; ติ๊กถูกเมื่อยอมรับแล้ว */}
      <Pressable
        style={styles.privacyRow}
        onPress={() => router.push('/(auth)/privacy')}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: privacyAccepted }}
      >
        <View style={[styles.radio, privacyAccepted && styles.radioOn]}>
          {privacyAccepted ? <Text style={styles.tick}>✓</Text> : null}
        </View>
        <Text style={styles.privacyText}>Privacy Policy : PDPA</Text>
      </Pressable>
      {errors.privacy ? <Text style={styles.privacyError}>{errors.privacy}</Text> : null}

      <SocialRow
        onPress={(p) => notify('ยังไม่เปิดใช้งาน', `การสมัครด้วย ${p === 'google' ? 'Google' : 'Facebook'} ยังไม่เปิดให้ใช้งานในเวอร์ชันนี้`)}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '800', color: authColors.text },
  link: { color: authColors.brandGreen, fontWeight: '800' },
  rule: { height: 1, backgroundColor: '#C9C9C9', marginTop: 12 },
  serverError: { marginTop: 12, textAlign: 'center', color: authColors.error, fontSize: 13 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EDEDED',
    borderWidth: 1,
    borderColor: '#B8B8B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: authColors.brandGreen, borderColor: authColors.brandGreen },
  tick: { color: '#fff', fontSize: 14, fontWeight: '900' },
  privacyText: { marginLeft: 6, fontSize: 14, fontWeight: '800', color: authColors.text },
  privacyError: { marginTop: 6, textAlign: 'center', color: authColors.error, fontSize: 12 },
});
