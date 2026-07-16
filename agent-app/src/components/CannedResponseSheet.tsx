import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { fetchCannedResponses, type CannedResponse } from '../api/cannedResponses';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';

type Props = {
  visible: boolean;
  accountId: number;
  onSelect: (content: string) => void;
  onClose: () => void;
};

export default function CannedResponseSheet({ visible, accountId, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [search, setSearch] = useState('');
  const [responses, setResponses] = useState<CannedResponse[]>([]);

  useEffect(() => {
    if (!visible) return;
    fetchCannedResponses(accountId, search || undefined).then(setResponses);
  }, [visible, accountId, search]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Canned responses</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.close}>Close</Text>
          </Pressable>
        </View>
        <TextInput
          style={styles.search}
          placeholder="Search by shortcode or content…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        <FlatList
          data={responses}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => {
                onSelect(item.content);
                onClose();
              }}
            >
              <Text style={styles.shortCode}>/{item.short_code}</Text>
              <Text style={styles.content} numberOfLines={2}>
                {item.content}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No canned responses found</Text>
          }
        />
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingTop: 48 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    title: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
    close: { color: colors.accent, fontWeight: '600' },
    search: {
      marginHorizontal: 16,
      marginBottom: 8,
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
    shortCode: { color: colors.accent, fontWeight: '600', marginBottom: 2 },
    content: { color: colors.textSecondary },
    empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
  });
