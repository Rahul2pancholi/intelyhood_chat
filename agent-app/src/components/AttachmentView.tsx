import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';
import type { MessageAttachment } from '../api/messages';

type Props = {
  attachment: MessageAttachment;
  tint: 'light' | 'dark';
  onPressImage: (uri: string) => void;
};

export default function AttachmentView({ attachment, tint, onPressImage }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (attachment.file_type === 'image') {
    return (
      <Pressable onPress={() => onPressImage(attachment.data_url)}>
        <Image source={{ uri: attachment.data_url }} style={styles.image} contentFit="cover" />
      </Pressable>
    );
  }

  if (attachment.file_type === 'audio') {
    return <VoiceMessagePlayer uri={attachment.data_url} tint={tint} />;
  }

  return (
    <Pressable
      style={styles.fileChip}
      onPress={() => Linking.openURL(attachment.data_url)}
    >
      <Text style={tint === 'light' ? styles.fileTextLight : styles.fileTextDark}>
        📎 {attachment.file_type} attachment
      </Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    image: { width: 200, height: 150, borderRadius: 8, marginBottom: 4 },
    fileChip: {
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
    fileTextLight: { color: colors.accentText, textDecorationLine: 'underline' },
    fileTextDark: { color: colors.textPrimary, textDecorationLine: 'underline' },
  });
