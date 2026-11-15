import { Platform } from 'react-native';

/**
 * ที่เก็บโทเคนล็อกอิน
 * - มือถือ: expo-secure-store (เข้ารหัสด้วย Keychain/Keystore)
 * - เว็บ: localStorage (ใช้ทดสอบ)
 */
export const storage = {
  async get(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
      const SecureStore = require('expo-secure-store') as typeof import('expo-secure-store');
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') return void globalThis.localStorage?.setItem(key, value);
      const SecureStore = require('expo-secure-store') as typeof import('expo-secure-store');
      await SecureStore.setItemAsync(key, value);
    } catch {
      /* เก็บไม่ได้ = ต้องล็อกอินใหม่รอบหน้า ไม่ให้แอปพัง */
    }
  },
  async remove(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') return void globalThis.localStorage?.removeItem(key);
      const SecureStore = require('expo-secure-store') as typeof import('expo-secure-store');
      await SecureStore.deleteItemAsync(key);
    } catch {
      /* ignore */
    }
  },
};
