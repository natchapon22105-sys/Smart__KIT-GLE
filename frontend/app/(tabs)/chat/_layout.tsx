import { Stack } from 'expo-router';

export default function ChatLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#2B4837' } }} />;
}
