import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import {
  fetchConversations,
  type AssigneeType,
  type Conversation,
  type ConversationStatus,
} from '../api/conversations';
import { fetchInboxes, type Inbox } from '../api/inboxes';
import { formatMentionsForDisplay } from '../utils/mentions';
import OptionSheet, { type SheetOption } from '../components/OptionSheet';
import { onRoomEvent } from '../realtime/cable';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';
import type { ConversationsStackParamList } from '../navigation/ConversationsStackNavigator';

const LIST_REFRESH_EVENTS = new Set([
  'conversation.created',
  'conversation.updated',
  'conversation.status_changed',
  'conversation.unread_count_changed',
  'assignee.changed',
  'message.created',
]);

const ASSIGNEE_TABS: { label: string; value: AssigneeType }[] = [
  { label: 'Mine', value: 'me' },
  { label: 'Unassigned', value: 'unassigned' },
  { label: 'All', value: 'assigned' },
];

const STATUS_FILTERS: { label: string; value: ConversationStatus }[] = [
  { label: 'Open', value: 'open' },
  { label: 'Pending', value: 'pending' },
  { label: 'Snoozed', value: 'snoozed' },
  { label: 'Resolved', value: 'resolved' },
];

export default function ConversationsListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ConversationsStackParamList>>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const accountId = useAuthStore(state => state.activeAccountId);
  const [assigneeType, setAssigneeType] = useState<AssigneeType>('me');
  const [status, setStatus] = useState<ConversationStatus>('open');
  const [inboxes, setInboxes] = useState<Inbox[]>([]);
  const [inboxId, setInboxId] = useState<number | undefined>(undefined);
  const [inboxSheetVisible, setInboxSheetVisible] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (targetPage: number, replace: boolean) => {
      if (!accountId) return;
      setLoading(true);
      try {
        const { payload } = await fetchConversations({
          accountId,
          status,
          assigneeType,
          inboxId,
          page: targetPage,
        });
        setConversations(prev => (replace ? payload : [...prev, ...payload]));
        setHasMore(payload.length > 0);
        setPage(targetPage);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accountId, status, assigneeType, inboxId],
  );

  useEffect(() => {
    load(1, true);
  }, [load]);

  useEffect(() => {
    if (accountId) fetchInboxes(accountId).then(setInboxes);
  }, [accountId]);

  const inboxOptions: SheetOption<number | undefined>[] = [
    { label: 'All inboxes', value: undefined },
    ...inboxes.map(inbox => ({ label: inbox.name, value: inbox.id })),
  ];
  const activeInboxName = inboxes.find(i => i.id === inboxId)?.name ?? 'All inboxes';

  useEffect(
    () =>
      onRoomEvent(({ event }) => {
        if (LIST_REFRESH_EVENTS.has(event)) load(1, true);
      }),
    [load],
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {ASSIGNEE_TABS.map(tab => (
          <Pressable
            key={tab.value}
            style={[styles.tab, assigneeType === tab.value && styles.tabActive]}
            onPress={() => setAssigneeType(tab.value)}
          >
            <Text style={[styles.tabText, assigneeType === tab.value && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView horizontal style={styles.filterRow} showsHorizontalScrollIndicator={false}>
        {STATUS_FILTERS.map(filter => (
          <Pressable
            key={filter.value}
            style={[styles.filterChip, status === filter.value && styles.filterChipActive]}
            onPress={() => setStatus(filter.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                status === filter.value && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </Pressable>
        ))}
        <Pressable style={styles.filterChip} onPress={() => setInboxSheetVisible(true)}>
          <Text style={styles.filterChipText}>Inbox: {activeInboxName}</Text>
        </Pressable>
      </ScrollView>

      <FlatList
        data={conversations}
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
              <Text style={styles.emptyText}>No conversations here</Text>
            </View>
          ) : null
        }
        ListFooterComponent={loading ? <ActivityIndicator style={{ margin: 16 }} /> : null}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() =>
              navigation.navigate('ConversationDetail', { conversationId: item.id })
            }
          >
            <View style={styles.rowHeader}>
              <Text style={styles.rowName} numberOfLines={1}>
                {item.meta.sender?.name ?? 'Unknown contact'}
              </Text>
              {item.unread_count > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{item.unread_count}</Text>
                </View>
              )}
            </View>
            <Text style={styles.rowSnippet} numberOfLines={1}>
              {item.last_non_activity_message?.content
                ? formatMentionsForDisplay(item.last_non_activity_message.content)
                : 'No messages yet'}
            </Text>
          </Pressable>
        )}
      />

      <OptionSheet
        visible={inboxSheetVisible}
        title="Filter by inbox"
        options={inboxOptions}
        onSelect={setInboxId}
        onClose={() => setInboxSheetVisible(false)}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    tabRow: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: colors.accent },
    tabText: { color: colors.textMuted, fontWeight: '500' },
    tabTextActive: { color: colors.accent },
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.chipBg,
    },
    filterChipActive: { backgroundColor: colors.accent },
    filterChipText: { color: colors.chipText, fontSize: 13 },
    filterChipTextActive: { color: colors.accentText },
    row: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowName: { fontSize: 15, fontWeight: '600', flex: 1, color: colors.textPrimary },
    rowSnippet: { color: colors.textMuted, marginTop: 4 },
    unreadBadge: {
      backgroundColor: colors.accent,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    unreadBadgeText: { color: colors.accentText, fontSize: 11, fontWeight: '700' },
    empty: { padding: 40, alignItems: 'center' },
    emptyText: { color: colors.textMuted },
  });
