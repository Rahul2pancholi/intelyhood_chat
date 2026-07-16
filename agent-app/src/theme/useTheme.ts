import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { darkColors, lightColors, type ThemeColors } from './colors';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'theme_mode';

type ThemeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const useThemeStore = create<ThemeState>(set => ({
  mode: 'system',
  setMode: mode => {
    set({ mode });
    SecureStore.setItemAsync(STORAGE_KEY, mode);
  },
}));

// Call once near the app root to restore the persisted preference.
export function useRestoreThemeMode(): void {
  const setMode = useThemeStore(state => state.setMode);
  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then(stored => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        useThemeStore.setState({ mode: stored });
      }
    });
  }, [setMode]);
}

export function useTheme(): {
  colors: ThemeColors;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
} {
  const systemScheme = useColorScheme();
  const mode = useThemeStore(state => state.mode);
  const setMode = useThemeStore(state => state.setMode);
  const resolvedScheme = mode === 'system' ? (systemScheme ?? 'light') : mode;
  const isDark = resolvedScheme === 'dark';
  return { colors: isDark ? darkColors : lightColors, mode, isDark, setMode };
}
