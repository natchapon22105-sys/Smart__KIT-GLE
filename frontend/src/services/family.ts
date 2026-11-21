import { api } from '@/services/api/client';

export type FamilyPerson = { id: number; userId: number; username: string; displayName: string };
export type FamilyConnected = FamilyPerson & {
  /** sharing = เขาดูข้อมูลฉัน · watching = ฉันดูข้อมูลเขา */
  direction: 'sharing' | 'watching';
};
export type FamilyLinks = { waiting: FamilyPerson[]; incoming: FamilyPerson[]; connected: FamilyConnected[] };

export const family = {
  links: () => api.get<FamilyLinks>('/family/links'),
  /** ส่งคำขอด้วย username หรืออีเมล */
  invite: (query: string) => api.post('/family/invite', { query }),
  respond: (id: number, accept: boolean) => api.post(`/family/${id}/respond`, { accept }),
  /** ใช้ทั้ง CANCEL (คำขอที่ส่ง) และ UN-LINK (ที่เชื่อมแล้ว) */
  remove: (id: number) => api.del(`/family/${id}`),
};
