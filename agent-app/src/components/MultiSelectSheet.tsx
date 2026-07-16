import { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';

export type MultiSelectOption<T> = { label: string; value: T; subtitle?: string };

type Props<T> = {
  visible: boolean;
  title: string;
  options: MultiSelectOption<T>[];
  initialSelected: T[];
  keyExtractor: (value: T) => string;
  onConfirm: (selected: T[]) => void;
  onClose: () => void;
};

export default function MultiSelectSheet<T>({
  visible,
  title,
  options,
  initialSelected,
  keyExtractor,
  onConfirm,
  onClose,
}: Props<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) setSelectedKeys(new Set(initialSelected.map(keyExtractor)));
  }, [visible, initialSelected, keyExtractor]);

  const toggle = (value: T) => {
    const key = keyExtractor(value);
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>{title}</Text>
          <Pressable
            onPress={() => {
              onConfirm(options.filter(o => selectedKeys.has(keyExtractor(o.value))).map(o => o.value));
              onClose();
            }}
          >
            <Text style={styles.done}>Done</Text>
          </Pressable>
        </View>
        <FlatList
          data={options}
          keyExtractor={option => keyExtractor(option.value)}
          renderItem={({ item }) => {
            const selected = selectedKeys.has(keyExtractor(item.value));
            return (
              <Pressable style={styles.row} onPress={() => toggle(item.value)}>
                <View>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  {item.subtitle && <Text style={styles.rowSubtitle}>{item.subtitle}</Text>}
                </View>
                <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </Pressable>
            );
          }}
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
    title: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
    cancel: { color: colors.textMuted },
    done: { color: colors.accent, fontWeight: '600' },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rowLabel: { fontSize: 15, color: colors.textPrimary },
    rowSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
    checkmark: { color: colors.accentText, fontSize: 13, fontWeight: '700' },
  });
