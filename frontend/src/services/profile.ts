import { api } from '@/services/api/client';

export type Gender = 'male' | 'female' | 'other';
export type Profile = {
  email: string;
  username: string;
  displayName: string;
  /** YYYY-MM-DD */
  birthDate: string | null;
  gender: Gender | null;
  heightCm: number | null;
  weightKg: number | null;
  /** data URI ของรูปโปรไฟล์ */
  avatar: string | null;
};
export type ProfileInput = Pick<Profile, 'displayName' | 'birthDate' | 'gender' | 'heightCm' | 'weightKg'>;

export const profileApi = {
  get: async () => (await api.get<{ profile: Profile }>('/profile')).profile,
  save: async (v: ProfileInput) => (await api.put<{ profile: Profile }>('/profile', v)).profile,
  setAvatar: async (image: string | null) => (await api.put<{ avatar: string | null }>('/profile/avatar', { image })).avatar,
  report: (message: string) => api.post('/reports', { message }),
};

/** อายุเป็นปีเต็มจากวันเกิด YYYY-MM-DD (null ถ้าไม่ระบุ/ไม่ถูกต้อง) */
export function ageFromBirthDate(birthDate: string | null, now = new Date()): number | null {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const [y, m, d] = birthDate.split('-').map(Number) as [number, number, number];
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}
