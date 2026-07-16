import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { searchAll, type SearchResults } from '../api/search';
import { formatMentionsForDisplay } from '../utils/mentions';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';
import type { ConversationsStackParamList } from '../navigation/ConversationsStackNavigator';

type Row =
  | { kind: 'conversation'; key: string; title: string; subtitle: string; conversationId: number }
  | { kind: 'message'; key: string; title: string; subtitle: string; conversationId: number }
  | { kind: 'contact'; key: string; title: string; subtitle: string };

function toRows(results: SearchResults): Row[] {
  const conversationRows: Row[] = results.conversations.map(c => ({
    kind: 'conversation',
    key: `conversation-${c.id}`,
    title: c.contact?.name ?? 'Unknown contact',
    subtitle: formatMentionsForDisplay(c.message?.content) || 'No messages yet',
    conversationId: c.id,
  }));
  const messageRows: Row[] = results.messages
    .filter(m => m.conversation_id)
    .map(m => ({
      kind: 'message',
      key: `message-${m.id}`,
      title: formatMentionsForDisplay(m.content) || '—',
      subtitle: `Conversation #${m.conversation_id}`,
      conversationId: m.conversation_id,
    }));
  const contactRows: Row[] = results.contacts.map(c => ({
    kind: 'contact',
    key: `contact-${c.id}`,
    title: c.name,
    subtitle: c.email ?? c.phone_number ?? '—',
  }));
  return [...conversationRows, ...messageRows, ...contactRows];
}

export default function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ConversationsStackParamList>>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const accountId = useAuthStore(state => state.activeAccountId);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  const runSearch = async (text: string) => {
    setQuery(text);
    if (!accountId || text.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      setResults(await searchAll(accountId, text.trim()));
    } finally {
      setLoading(false);
    }
  };

  const rows = results ? toRows(results) : [];

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search conversations, messages, contacts…"
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={runSearch}
        autoFocus
      />
      <FlatList
        data={rows}
        keyExtractor={row => row.key}
        ListEmptyComponent={
          !loading && query.trim().length >= 2 ? (
            <Text style={styles.empty}>No results</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            disabled={item.kind === 'contact'}
            onPress={() => {
              if (item.kind !== 'contact') {
                navigation.navigate('ConversationDetail', {
                  conversationId: item.conversationId,
                });
              }
            }}
          >
            <Text style={styles.rowTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.rowSubtitle} numberOfLines={1}>
              {item.subtitle}
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
    input: {
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
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rowTitle: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
    rowSubtitle: { color: colors.textMuted, marginTop: 2 },
    empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
  });
