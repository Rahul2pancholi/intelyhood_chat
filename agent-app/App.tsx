import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { useRestoreThemeMode, useTheme } from './src/theme/useTheme';

export default function App() {
  useRestoreThemeMode();
  const { isDark } = useTheme();

  return (
    <SafeAreaProvider>
      <RootNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}
