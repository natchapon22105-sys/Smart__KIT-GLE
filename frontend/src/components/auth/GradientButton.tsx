import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradient } from '@/theme/tokens';

/** ปุ่มเม็ดยาวไล่สีเขียว (Login / Sign Up / Confirm) */
export function GradientButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const off = disabled || loading;
  return (
    <View style={[styles.shadow, off && { opacity: 0.6 }]}>
      <Pressable onPress={onPress} disabled={off} accessibilityRole="button" accessibilityLabel={label}>
        <LinearGradient colors={gradient.button} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.btn}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.label}>{label}</Text>}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    alignSelf: 'center',
    width: '78%',
    maxWidth: 320,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  btn: { height: 44, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.white, fontSize: 17, fontWeight: '800' },
});
