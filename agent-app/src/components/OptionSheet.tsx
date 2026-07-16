import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';

export type SheetOption<T> = { label: string; value: T };

type Props<T> = {
  visible: boolean;
  title: string;
  options: SheetOption<T>[];
  onSelect: (value: T) => void;
  onClose: () => void;
};

export default function OptionSheet<T>({ visible, title, options, onSelect, onClose }: Props<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          {options.map(option => (
            <Pressable
              key={option.label}
              style={styles.option}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}
            >
              <Text style={styles.optionText}>{option.label}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingBottom: 24,
      paddingTop: 12,
    },
    title: {
      fontSize: 14,
      color: colors.textMuted,
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    option: {
      paddingVertical: 14,
      paddingHorizontal: 20,
    },
    optionText: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    cancel: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      marginTop: 4,
    },
    cancelText: {
      fontSize: 16,
      color: colors.danger,
      fontWeight: '600',
    },
  });
