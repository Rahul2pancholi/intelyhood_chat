import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { fetchContacts, searchContacts, type Contact } from '../api/contacts';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';
import type { ContactsStackParamList } from '../navigation/ContactsStackNavigator';

export default function ContactsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ContactsStackParamList>>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const accountId = useAuthStore(state => state.activeAccountId);
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (targetPage: number, replace: boolean) => {
      if (!accountId) return;
      setLoading(true);
      try {
        const { payload } = query.trim()
          ? await searchContacts(accountId, query.trim(), targetPage)
          : await fetchContacts(accountId, targetPage);
        setContacts(prev => (replace ? payload : [...prev, ...payload]));
        setHasMore(payload.length > 0);
        setPage(targetPage);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accountId, query],
  );

  useEffect(() => {
    load(1, true);
  }, [load]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search contacts…"
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={setQuery}
      />

      <FlatList
        data={contacts}
        keyExtractor={item => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load(1, true);
            }}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (!loading && hasMore) load(page + 1, false);
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No contacts found</Text>
            </View>
          ) : null
        }
        ListFooterComponent={loading ? <ActivityIndicator style={{ margin: 16 }} /> : null}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('ContactDetail', { contactId: item.id })}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {item.email ?? item.phone_number ?? '—'}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    search: {
      margin: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      color: colors.textPrimary,
    },
    row: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    name: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    subtitle: { color: colors.textMuted, marginTop: 2 },
    empty: { padding: 40, alignItems: 'center' },
    emptyText: { color: colors.textMuted },
  });
