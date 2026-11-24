import { api } from '@/services/api/client';

export type ChatMessage = {
  id: number;
  senderId: number;
  senderName: string;
  body: string | null;
  imageData: string | null;
  createdAt: string;
};

export const chat = {
  messages: async (linkId: number, afterId?: number) => {
    const query = afterId === undefined ? '' : `?afterId=${afterId}`;
    return (await api.get<{ messages: ChatMessage[] }>(`/family/${linkId}/messages${query}`)).messages;
  },
  send: (linkId: number, message: { body?: string; imageData?: string }) =>
    api.post<ChatMessage>(`/family/${linkId}/messages`, message),
};
