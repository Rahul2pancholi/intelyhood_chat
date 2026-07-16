import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { fetchContact, fetchContactConversations, type Contact } from '../api/contacts';
import type { Conversation } from '../api/conversations';
import type { ContactsStackParamList } from '../navigation/ContactsStackNavigator';
import { formatMentionsForDisplay } from '../utils/mentions';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';

export default function ContactDetailScreen() {
  const route = useRoute<RouteProp<ContactsStackParamList, 'ContactDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<ContactsStackParamList>>();
  const { contactId } = route.params;
  const accountId = useAuthStore(state => state.activeAccountId);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [contact, setContact] = useState<Contact | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accountId) return;
    Promise.all([
      fetchContact(accountId, contactId),
      fetchContactConversations(accountId, contactId),
    ])
      .then(([contactData, conversationsResponse]) => {
        setContact(contactData);
        setConversations(conversationsResponse.payload);
      })
      .finally(() => setLoading(false));
  }, [accountId, contactId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={item => String(item.id)}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.name}>{contact?.name}</Text>
          {contact?.email && <Text style={styles.detail}>{contact.email}</Text>}
          {contact?.phone_number && <Text style={styles.detail}>{contact.phone_number}</Text>}
          <Text style={styles.sectionTitle}>Conversations</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>No past conversations</Text>}
      renderItem={({ item }) => (
        <Pressable
          style={styles.row}
          onPress={() => navigation.navigate('ConversationDetail', { conversationId: item.id })}
        >
          <Text style={styles.rowStatus}>{item.status}</Text>
          <Text style={styles.rowSnippet} numberOfLines={1}>
            {item.last_non_activity_message?.content
              ? formatMentionsForDisplay(item.last_non_activity_message.content)
              : 'No messages yet'}
          </Text>
        </Pressable>
      )}
    />
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    header: { padding: 16, backgroundColor: colors.background },
    name: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
    detail: { color: colors.textMuted, marginTop: 4 },
    sectionTitle: { marginTop: 20, fontSize: 13, color: colors.textMuted, fontWeight: '600' },
    row: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    rowStatus: { fontSize: 12, color: colors.accent, fontWeight: '600', textTransform: 'uppercase' },
    rowSnippet: { color: colors.textSecondary, marginTop: 4 },
    empty: { padding: 24, color: colors.textMuted, textAlign: 'center' },
  });
