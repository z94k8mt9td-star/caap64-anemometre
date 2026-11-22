import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { UnitsProvider } from '../context/UnitsContext';
import { theme } from '../theme';

export default function RootLayout() {
  return (
    <UnitsProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
        }}
      />
    </UnitsProvider>
  );
}
