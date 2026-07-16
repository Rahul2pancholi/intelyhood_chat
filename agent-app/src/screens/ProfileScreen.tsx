import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import {
  fetchNotificationSettings,
  setAutoOffline,
  setAvailability,
  updateSelectedPushFlags,
  type Availability,
  type NotificationSettings,
} from '../api/profile';
import OptionSheet, { type SheetOption } from '../components/OptionSheet';
import { useTheme, type ThemeMode } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';

const AVAILABILITY_OPTIONS: SheetOption<Availability>[] = [
  { label: 'Online', value: 'online' },
  { label: 'Busy', value: 'busy' },
  { label: 'Offline', value: 'offline' },
];

const THEME_OPTIONS: SheetOption<ThemeMode>[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

export default function ProfileScreen() {
  const user = useAuthStore(state => state.user);
  const signOut = useAuthStore(state => state.signOut);
  const switchAccount = useAuthStore(state => state.switchAccount);
  const accountId = useAuthStore(state => state.activeAccountId);
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [availability, setAvailabilityState] = useState<Availability>('online');
  const [autoOffline, setAutoOfflineState] = useState(true);
  const [availabilitySheetVisible, setAvailabilitySheetVisible] = useState(false);
  const [themeSheetVisible, setThemeSheetVisible] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accountId) return;
    const account = user?.accounts.find(a => a.id === accountId);
    if (account) setAvailabilityState(account.availability);

    fetchNotificationSettings(accountId)
      .then(setSettings)
      .finally(() => setLoading(false));
  }, [accountId, user]);

  const togglePushFlag = (flag: string) => {
    if (!accountId || !settings) return;
    const next = settings.selected_push_flags.includes(flag)
      ? settings.selected_push_flags.filter(f => f !== flag)
      : [...settings.selected_push_flags, flag];
    setSettings({ ...settings, selected_push_flags: next });
    updateSelectedPushFlags(accountId, next);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      {user && user.accounts.length > 1 && (
        <>
          <Text style={styles.sectionTitle}>Account</Text>
          {user.accounts.map(account => (
            <Pressable
              key={account.id}
              style={styles.row}
              onPress={() => switchAccount(account.id)}
            >
              <Text style={styles.rowLabel}>{account.name}</Text>
              {account.id === accountId && <Text style={styles.rowValue}>Active</Text>}
            </Pressable>
          ))}
        </>
      )}

      <Text style={styles.sectionTitle}>Availability</Text>
      <Pressable
        style={styles.row}
        onPress={() => setAvailabilitySheetVisible(true)}
      >
        <Text style={styles.rowLabel}>Status</Text>
        <Text style={styles.rowValue}>{availability}</Text>
      </Pressable>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Auto offline when inactive</Text>
        <Switch
          value={autoOffline}
          onValueChange={value => {
            setAutoOfflineState(value);
            if (accountId) setAutoOffline(accountId, value);
          }}
        />
      </View>

      <Text style={styles.sectionTitle}>Appearance</Text>
      <Pressable style={styles.row} onPress={() => setThemeSheetVisible(true)}>
        <Text style={styles.rowLabel}>Theme</Text>
        <Text style={styles.rowValue}>{mode}</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Push notifications</Text>
      {settings?.all_push_flags.map(flag => (
        <View style={styles.row} key={flag}>
          <Text style={styles.rowLabel}>{flag.replace(/_/g, ' ')}</Text>
          <Switch
            value={settings.selected_push_flags.includes(flag)}
            onValueChange={() => togglePushFlag(flag)}
          />
        </View>
      ))}

      <Pressable style={styles.logoutButton} onPress={() => signOut()}>
        <Text style={styles.logoutButtonText}>Log out</Text>
      </Pressable>

      <OptionSheet
        visible={availabilitySheetVisible}
        title="Set availability"
        options={AVAILABILITY_OPTIONS}
        onSelect={value => {
          setAvailabilityState(value);
          if (accountId) setAvailability(accountId, value);
        }}
        onClose={() => setAvailabilitySheetVisible(false)}
      />
      <OptionSheet
        visible={themeSheetVisible}
        title="Theme"
        options={THEME_OPTIONS}
        onSelect={setMode}
        onClose={() => setThemeSheetVisible(false)}
      />
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    content: { padding: 20 },
    name: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
    email: { color: colors.textMuted, marginTop: 4, marginBottom: 8 },
    sectionTitle: {
      marginTop: 24,
      marginBottom: 4,
      fontSize: 13,
      color: colors.textMuted,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rowLabel: { fontSize: 15, color: colors.textPrimary, textTransform: 'capitalize' },
    rowValue: { color: colors.accent, fontWeight: '600', textTransform: 'capitalize' },
    logoutButton: {
      marginTop: 32,
      backgroundColor: colors.dangerBg,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
    },
    logoutButtonText: { color: colors.accentText, fontWeight: '600', fontSize: 16 },
  });
