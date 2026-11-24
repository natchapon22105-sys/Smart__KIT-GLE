import { Stack } from 'expo-router';

export default function UserProfileLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#2B4837' } }} />;
}
