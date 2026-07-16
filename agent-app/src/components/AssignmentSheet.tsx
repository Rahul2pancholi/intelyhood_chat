import { useMemo } from 'react';
import { Modal, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import type { Agent } from '../api/conversations';
import type { Team } from '../api/teams';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';

type Props = {
  visible: boolean;
  agents: Agent[];
  teams: Team[];
  onSelectAgent: (agent: Agent) => void;
  onSelectTeam: (team: Team) => void;
  onClose: () => void;
};

export default function AssignmentSheet({
  visible,
  agents,
  teams,
  onSelectAgent,
  onSelectTeam,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  type Row = { key: string; label: string; agent?: Agent; team?: Team };
  const sections: { title: string; data: Row[] }[] = [
    {
      title: 'Agents',
      data: agents.map(a => ({ key: `agent-${a.id}`, label: a.name, agent: a })),
    },
    {
      title: 'Teams',
      data: teams.map(t => ({ key: `team-${t.id}`, label: t.name, team: t })),
    },
  ].filter(section => section.data.length > 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          <SectionList
            sections={sections}
            keyExtractor={item => item.key}
            renderSectionHeader={({ section }) => (
              <Text style={styles.sectionHeader}>{section.title}</Text>
            )}
            renderItem={({ item }) => (
              <Pressable
                style={styles.option}
                onPress={() => {
                  if (item.agent) onSelectAgent(item.agent);
                  if (item.team) onSelectTeam(item.team);
                  onClose();
                }}
              >
                <Text style={styles.optionText}>{item.label}</Text>
              </Pressable>
            )}
          />
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
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingTop: 12,
      paddingBottom: 24,
      maxHeight: '70%',
    },
    sectionHeader: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
      textTransform: 'uppercase',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 4,
    },
    option: { paddingVertical: 12, paddingHorizontal: 20 },
    optionText: { fontSize: 16, color: colors.textPrimary },
    cancel: { paddingVertical: 14, paddingHorizontal: 20, marginTop: 4 },
    cancelText: { fontSize: 16, color: colors.danger, fontWeight: '600' },
  });
