import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  resolveConversationId,
  type Notification,
} from '../api/notifications';
import { onRoomEvent } from '../realtime/cable';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';
import type { NotificationsStackParamList } from '../navigation/NotificationsStackNavigator';

export default function NotificationsListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<NotificationsStackParamList>>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const accountId = useAuthStore(state => state.activeAccountId);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const { meta, payload } = await fetchNotifications(accountId);
      setNotifications(payload);
      setUnreadCount(meta.unread_count);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accountId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(
    () =>
      onRoomEvent(({ event }) => {
        if (event === 'notification.created') load();
      }),
    [load],
  );

  const handlePress = async (notification: Notification) => {
    if (!accountId) return;
    if (!notification.read_at) {
      markNotificationRead(accountId, notification.id).then(load);
    }
    const conversationId = resolveConversationId(notification);
    if (conversationId) {
      navigation.navigate('ConversationDetail', { conversationId });
    }
  };

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <Pressable
          style={styles.markAllRow}
          onPress={() => accountId && markAllNotificationsRead(accountId).then(load)}
        >
          <Text style={styles.markAllText}>Mark all read ({unreadCount})</Text>
        </Pressable>
      )}
      <FlatList
        data={notifications}
        keyExtractor={item => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No notifications</Text>
            </View>
          ) : null
        }
        ListFooterComponent={loading ? <ActivityIndicator style={{ margin: 16 }} /> : null}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => handlePress(item)}>
            {!item.read_at && <View style={styles.unreadDot} />}
            <View style={styles.rowContent}>
              <Text style={[styles.title, !item.read_at && styles.titleUnread]}>
                {item.push_message_title}
              </Text>
              <Text style={styles.body} numberOfLines={2}>
                {item.push_message_body}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    markAllRow: {
      padding: 12,
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    markAllText: { color: colors.accent, fontWeight: '600' },
    row: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: 10,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
      marginTop: 6,
    },
    rowContent: { flex: 1 },
    title: { fontSize: 15, color: colors.textSecondary },
    titleUnread: { fontWeight: '700', color: colors.textPrimary },
    body: { color: colors.textMuted, marginTop: 2 },
    empty: { padding: 40, alignItems: 'center' },
    emptyText: { color: colors.textMuted },
  });
