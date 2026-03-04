import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Escanear QR' }} />
      <Stack.Screen name="project/[id]" options={{ title: 'Evaluar' }} />
      <Stack.Screen name="success" options={{ title: 'Éxito' }} />
    </Stack>
  );
}
