import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';

type Props = { uri: string; tint: 'light' | 'dark' };

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VoiceMessagePlayer({ uri, tint }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, tint), [colors, tint]);
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const toggle = () => {
    if (status.playing) {
      player.pause();
    } else {
      if (status.didJustFinish) player.seekTo(0);
      player.play();
    }
  };

  return (
    <Pressable style={styles.container} onPress={toggle}>
      <Text style={styles.icon}>{status.playing ? '⏸' : '▶️'}</Text>
      <View style={styles.track}>
        <View
          style={[
            styles.progress,
            { width: `${status.duration ? (status.currentTime / status.duration) * 100 : 0}%` },
          ]}
        />
      </View>
      <Text style={styles.time}>{formatTime(status.duration - status.currentTime)}</Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors, tint: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minWidth: 160,
      paddingVertical: 4,
    },
    icon: { fontSize: 16 },
    track: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: tint === 'light' ? 'rgba(255,255,255,0.4)' : colors.border,
      overflow: 'hidden',
    },
    progress: {
      height: '100%',
      backgroundColor: tint === 'light' ? '#ffffff' : colors.accent,
    },
    time: {
      fontSize: 11,
      color: tint === 'light' ? colors.accentText : colors.textMuted,
      minWidth: 32,
    },
  });
