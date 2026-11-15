import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError, api, setAuthToken } from '@/services/api/client';
import { storage } from '@/services/storage';

export type User = { id: number; email: string; username: string };

type AuthResponse = { token: string; user: User };

type RegisterInput = { email: string; username: string; password: string };

type AuthState = {
  user: User | null;
  token: string | null;
  /** true ระหว่างตรวจโทเคนที่เก็บไว้ตอนเปิดแอป */
  loading: boolean;
  /** ผู้ใช้กดยืนยัน Privacy Policy (PDPA) แล้วหรือยัง — ใช้ระหว่างหน้า Sign Up ↔ Privacy */
  privacyAccepted: boolean;
  setPrivacyAccepted: (v: boolean) => void;
  login: (identifier: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
};

const TOKEN_KEY = 'kitgle.token';
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const applySession = useCallback(async (res: AuthResponse) => {
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
    await storage.set(TOKEN_KEY, res.token);
  }, []);

  // เปิดแอป: ถ้ามีโทเคนเก็บไว้ ตรวจกับเซิร์ฟเวอร์ว่ายังใช้ได้ไหม
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await storage.get(TOKEN_KEY);
      if (!saved) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        setAuthToken(saved);
        const { user: me } = await api.get<{ user: User }>('/auth/me');
        if (cancelled) return;
        setToken(saved);
        setUser(me);
      } catch (e) {
        // 401 = โทเคนหมดอายุ/ไม่ถูกต้อง → ล้างทิ้ง; เชื่อมต่อไม่ได้ (status 0) ก็ให้ล็อกอินใหม่ ไม่ค้างหน้าโหลด
        setAuthToken(null);
        if (e instanceof ApiError && e.status === 401) await storage.remove(TOKEN_KEY);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const res = await api.post<AuthResponse>('/auth/login', { identifier, password });
      await applySession(res);
    },
    [applySession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const res = await api.post<AuthResponse>('/auth/register', { ...input, acceptedPrivacy: true });
      setPrivacyAccepted(false);
      await applySession(res);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    await storage.remove(TOKEN_KEY);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, token, loading, privacyAccepted, setPrivacyAccepted, login, register, logout }),
    [user, token, loading, privacyAccepted, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth ต้องอยู่ภายใน <AuthProvider>');
  return ctx;
}
