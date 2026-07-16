import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { fetchConversationSummary, type ConversationSummary } from '../api/reports';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';

type RangeKey = 'today' | '7d' | '30d';

const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: 'today', label: 'Today', days: 1 },
  { key: '7d', label: '7 days', days: 7 },
  { key: '30d', label: '30 days', days: 30 },
];

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default function ReportsScreen() {
  const accountId = useAuthStore(state => state.activeAccountId);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [range, setRange] = useState<RangeKey>('7d');
  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    const days = RANGES.find(r => r.key === range)!.days;
    const until = Math.floor(Date.now() / 1000);
    const since = until - days * 24 * 60 * 60;
    fetchConversationSummary(accountId, since, until)
      .then(setSummary)
      .catch(() => setError('Reports are only available to account administrators.'))
      .finally(() => setLoading(false));
  }, [accountId, range]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.rangeRow}>
        {RANGES.map(r => (
          <Pressable
            key={r.key}
            style={[styles.rangeChip, range === r.key && styles.rangeChipActive]}
            onPress={() => setRange(r.key)}
          >
            <Text style={[styles.rangeChipText, range === r.key && styles.rangeChipTextActive]}>
              {r.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 40 }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {summary && !loading && (
        <View style={styles.grid}>
          <StatTile label="Conversations" value={String(summary.conversations_count)} />
          <StatTile label="Incoming messages" value={String(summary.incoming_messages_count)} />
          <StatTile label="Outgoing messages" value={String(summary.outgoing_messages_count)} />
          <StatTile label="Resolved" value={String(summary.resolutions_count)} />
          <StatTile
            label="Avg first response"
            value={formatDuration(summary.avg_first_response_time)}
          />
          <StatTile label="Avg resolution time" value={formatDuration(summary.avg_resolution_time)} />
        </View>
      )}
    </ScrollView>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16 },
    rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    rangeChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: colors.chipBg,
    },
    rangeChipActive: { backgroundColor: colors.accent },
    rangeChipText: { color: colors.chipText, fontSize: 13 },
    rangeChipTextActive: { color: colors.accentText },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    tile: {
      width: '47%',
      backgroundColor: colors.surfaceAlt,
      borderRadius: 12,
      padding: 16,
    },
    tileValue: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
    tileLabel: { color: colors.textMuted, marginTop: 4, fontSize: 12 },
    error: { color: colors.danger, textAlign: 'center', marginTop: 40, paddingHorizontal: 20 },
  });
