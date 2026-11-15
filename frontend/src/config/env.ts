export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000',
  useMockBle: (process.env.EXPO_PUBLIC_USE_MOCK_BLE ?? 'true') === 'true',
};
