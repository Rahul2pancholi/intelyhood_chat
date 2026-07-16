import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import {
  AudioModule,
  RecordingPresets,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import {
  fetchMessages,
  sendMessage,
  deleteMessage,
  MessageType,
  type Message,
  type PickedAttachment,
} from '../api/messages';
import { buildUserMention, formatMentionsForDisplay } from '../utils/mentions';
import CannedResponseSheet from '../components/CannedResponseSheet';
import {
  assignConversationToTeam,
  assignConversationToUser,
  fetchAssignableAgents,
  fetchConversation,
  fetchConversationParticipants,
  muteConversation,
  toggleConversationPriority,
  toggleConversationStatus,
  toggleTypingStatus,
  unmuteConversation,
  updateConversationLabels,
  updateConversationParticipants,
  type Agent,
  type Conversation,
  type ConversationPriority,
  type ConversationStatus,
} from '../api/conversations';
import { fetchTeams, type Team } from '../api/teams';
import { fetchAccountLabels, type Label } from '../api/labels';
import {
  rewriteContent,
  suggestReply,
  summarizeConversation,
  type RewriteOperation,
} from '../api/captain';
import OptionSheet, { type SheetOption } from '../components/OptionSheet';
import AssignmentSheet from '../components/AssignmentSheet';
import MultiSelectSheet from '../components/MultiSelectSheet';
import AttachmentView from '../components/AttachmentView';
import ImageViewerModal from '../components/ImageViewerModal';
import { onRoomEvent } from '../realtime/cable';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';
import type { ConversationDetailParams } from '../navigation/types';

const STATUS_OPTIONS: SheetOption<ConversationStatus>[] = [
  { label: 'Open', value: 'open' },
  { label: 'Pending', value: 'pending' },
  { label: 'Snoozed (24h)', value: 'snoozed' },
  { label: 'Resolved', value: 'resolved' },
];

const PRIORITY_OPTIONS: SheetOption<ConversationPriority>[] = [
  { label: 'None', value: null },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
];

const TYPING_DEBOUNCE_MS = 3000;

export default function ConversationDetailScreen() {
  const route =
    useRoute<RouteProp<{ ConversationDetail: ConversationDetailParams }, 'ConversationDetail'>>();
  const { conversationId } = route.params;
  const accountId = useAuthStore(state => state.activeAccountId);
  const currentUserId = useAuthStore(state => state.user?.id);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusSheetVisible, setStatusSheetVisible] = useState(false);
  const [prioritySheetVisible, setPrioritySheetVisible] = useState(false);
  const [assignmentSheetVisible, setAssignmentSheetVisible] = useState(false);
  const [labelSheetVisible, setLabelSheetVisible] = useState(false);
  const [participantSheetVisible, setParticipantSheetVisible] = useState(false);
  const [contactTyping, setContactTyping] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PickedAttachment[]>([]);
  const [cannedSheetVisible, setCannedSheetVisible] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [messageMenuTarget, setMessageMenuTarget] = useState<Message | null>(null);
  const [assignableAgents, setAssignableAgents] = useState<Agent[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [accountLabels, setAccountLabels] = useState<Label[]>([]);
  const [participants, setParticipants] = useState<Agent[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [copilotSheetVisible, setCopilotSheetVisible] = useState(false);
  const [copilotBusy, setCopilotBusy] = useState(false);
  const [voiceAttachment, setVoiceAttachment] = useState<PickedAttachment | null>(null);
  const [emailFieldsVisible, setEmailFieldsVisible] = useState(false);
  const [ccEmails, setCcEmails] = useState('');
  const [bccEmails, setBccEmails] = useState('');
  const [toEmails, setToEmails] = useState('');
  const [viewingImageUri, setViewingImageUri] = useState<string | null>(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const isEmailConversation = conversation?.meta.channel === 'Channel::Email';
  const listRef = useRef<FlatList<Message>>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!accountId) return;
    Promise.all([
      fetchConversation(accountId, conversationId),
      fetchMessages(accountId, conversationId),
    ])
      .then(([conversationData, payload]) => {
        setConversation(conversationData);
        setMessages([...payload].reverse());
        // Fetched eagerly (not just on-demand in the assignment/participant
        // sheets) so @mention suggestions work while composing.
        fetchAssignableAgents(accountId, conversationData.inbox_id).then(setAssignableAgents);
      })
      .finally(() => setLoading(false));
  }, [accountId, conversationId]);

  useEffect(
    () =>
      onRoomEvent(({ event, data }) => {
        if (data?.id !== conversationId && data?.conversation_id !== conversationId) return;

        if (event === 'message.created' || event === 'message.updated') {
          const message: Message = data;
          setMessages(prev =>
            prev.some(m => m.id === message.id)
              ? prev.map(m => (m.id === message.id ? message : m))
              : [...prev, message],
          );
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
        } else if (event === 'conversation.typing_on') {
          setContactTyping(true);
        } else if (event === 'conversation.typing_off') {
          setContactTyping(false);
        }
      }),
    [conversationId],
  );

  const messageById = useMemo(() => {
    const map = new Map<number, Message>();
    messages.forEach(m => map.set(m.id, m));
    return map;
  }, [messages]);

  const stopTyping = () => {
    if (!accountId || !isTypingRef.current) return;
    isTypingRef.current = false;
    toggleTypingStatus(accountId, conversationId, 'off', isPrivate);
  };

  const handleDraftChange = (text: string) => {
    setDraft(text);

    // Mentions only apply to private notes (see mention_service.rb — only
    // parsed when message.private?). Simple trailing "@word" trigger.
    if (isPrivate) {
      const match = text.match(/@(\w*)$/);
      setMentionQuery(match ? match[1] : null);
    } else {
      setMentionQuery(null);
    }

    if (!accountId) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      toggleTypingStatus(accountId, conversationId, 'on', isPrivate);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, TYPING_DEBOUNCE_MS);
  };

  const handleSelectMention = (agent: Agent) => {
    setDraft(prev => prev.replace(/@(\w*)$/, `${buildUserMention(agent.id, agent.name)} `));
    setMentionQuery(null);
  };

  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    return assignableAgents.filter(a =>
      a.name.toLowerCase().includes(mentionQuery.toLowerCase()),
    );
  }, [mentionQuery, assignableAgents]);

  const handleSend = async () => {
    const attachments = voiceAttachment ? [...pendingAttachments, voiceAttachment] : pendingAttachments;
    if (!accountId || (!draft.trim() && attachments.length === 0)) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    stopTyping();
    setSending(true);
    try {
      const message = await sendMessage(accountId, conversationId, draft.trim(), isPrivate, {
        attachments,
        inReplyTo: replyingTo?.id,
        isVoiceMessage: !!voiceAttachment,
        ccEmails: isEmailConversation ? ccEmails || undefined : undefined,
        bccEmails: isEmailConversation ? bccEmails || undefined : undefined,
        toEmails: isEmailConversation ? toEmails || undefined : undefined,
      });
      setMessages(prev => [...prev, message]);
      setDraft('');
      setPendingAttachments([]);
      setVoiceAttachment(null);
      setReplyingTo(null);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch {
      // Draft/attachments are deliberately kept so Retry re-sends the same content.
      Alert.alert('Message not sent', 'Check your connection and try again.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: () => handleSend() },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleToggleRecording = async () => {
    if (recorderState.isRecording) {
      await audioRecorder.stop();
      if (audioRecorder.uri) {
        setVoiceAttachment({
          uri: audioRecorder.uri,
          name: `voice-${Date.now()}.m4a`,
          mimeType: 'audio/m4a',
        });
      }
      return;
    }
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) return;
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
  };

  const handlePickImage = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (result.canceled) return;

    const asset = result.assets[0];
    setPendingAttachments(prev => [
      ...prev,
      {
        uri: asset.uri,
        name: asset.fileName ?? `attachment-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
      },
    ]);
  };

  const handleStatusChange = async (status: ConversationStatus) => {
    if (!accountId) return;
    const snoozedUntil =
      status === 'snoozed'
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : undefined;
    await toggleConversationStatus(accountId, conversationId, status, snoozedUntil);
    setConversation(prev => (prev ? { ...prev, status } : prev));
  };

  const handlePriorityChange = async (priority: ConversationPriority) => {
    if (!accountId) return;
    await toggleConversationPriority(accountId, conversationId, priority);
    setConversation(prev => (prev ? { ...prev, priority } : prev));
  };

  const handleToggleMute = async () => {
    if (!accountId || !conversation) return;
    if (conversation.muted) {
      await unmuteConversation(accountId, conversationId);
    } else {
      await muteConversation(accountId, conversationId);
    }
    setConversation(prev => (prev ? { ...prev, muted: !prev.muted } : prev));
  };

  const openAssignmentSheet = async () => {
    if (!accountId || !conversation) return;
    const [agents, teamList] = await Promise.all([
      fetchAssignableAgents(accountId, conversation.inbox_id),
      fetchTeams(accountId),
    ]);
    setAssignableAgents(agents);
    setTeams(teamList);
    setAssignmentSheetVisible(true);
  };

  const handleAssignToMe = async () => {
    if (!accountId || !currentUserId) return;
    await assignConversationToUser(accountId, conversationId, currentUserId);
  };

  const handleSelectAssigneeAgent = async (agent: Agent) => {
    if (!accountId) return;
    await assignConversationToUser(accountId, conversationId, agent.id);
  };

  const handleSelectAssigneeTeam = async (team: Team) => {
    if (!accountId) return;
    await assignConversationToTeam(accountId, conversationId, team.id);
  };

  const openLabelSheet = async () => {
    if (!accountId) return;
    setAccountLabels(await fetchAccountLabels(accountId));
    setLabelSheetVisible(true);
  };

  const handleLabelsConfirm = async (selected: Label[]) => {
    if (!accountId) return;
    const titles = selected.map(l => l.title);
    await updateConversationLabels(accountId, conversationId, titles);
    setConversation(prev => (prev ? { ...prev, labels: titles } : prev));
  };

  const openParticipantSheet = async () => {
    if (!accountId || !conversation) return;
    const [current, agents] = await Promise.all([
      fetchConversationParticipants(accountId, conversationId),
      fetchAssignableAgents(accountId, conversation.inbox_id),
    ]);
    setParticipants(current);
    setAssignableAgents(agents);
    setParticipantSheetVisible(true);
  };

  const handleCopilotAction = async (action: 'suggest_reply' | 'summarize' | RewriteOperation) => {
    if (!accountId) return;
    setCopilotBusy(true);
    try {
      const result =
        action === 'suggest_reply'
          ? await suggestReply(accountId, conversationId)
          : action === 'summarize'
            ? await summarizeConversation(accountId, conversationId)
            : await rewriteContent(accountId, draft, action, conversationId);

      if (result.error) {
        Alert.alert('Copilot unavailable', result.error);
      } else if (action === 'summarize') {
        Alert.alert('Conversation summary', result.message ?? 'No summary available');
      } else if (result.message) {
        setDraft(result.message);
      }
    } finally {
      setCopilotBusy(false);
    }
  };

  const handleCopyMessage = async (message: Message) => {
    await Clipboard.setStringAsync(formatMentionsForDisplay(message.content));
  };

  const handleDeleteMessage = async (message: Message) => {
    if (!accountId) return;
    await deleteMessage(accountId, conversationId, message.id);
    setMessages(prev =>
      prev.map(m => (m.id === message.id ? { ...m, content: 'This message was deleted' } : m)),
    );
  };

  const handleParticipantsConfirm = async (selected: Agent[]) => {
    if (!accountId) return;
    const updated = await updateConversationParticipants(
      accountId,
      conversationId,
      selected.map(a => a.id),
    );
    setParticipants(updated);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView horizontal style={styles.actionsRow} showsHorizontalScrollIndicator={false}>
        <Pressable style={styles.actionButton} onPress={() => setStatusSheetVisible(true)}>
          <Text style={styles.actionButtonText}>Status: {conversation?.status}</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => setPrioritySheetVisible(true)}>
          <Text style={styles.actionButtonText}>Priority: {conversation?.priority ?? 'none'}</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={handleAssignToMe}>
          <Text style={styles.actionButtonText}>Assign to me</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={openAssignmentSheet}>
          <Text style={styles.actionButtonText}>Assign…</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={openLabelSheet}>
          <Text style={styles.actionButtonText}>
            Labels{conversation?.labels.length ? ` (${conversation.labels.length})` : ''}
          </Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={openParticipantSheet}>
          <Text style={styles.actionButtonText}>Participants</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={handleToggleMute}>
          <Text style={styles.actionButtonText}>{conversation?.muted ? 'Unmute' : 'Mute'}</Text>
        </Pressable>
      </ScrollView>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => String(item.id)}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => {
          if (item.message_type === MessageType.activity) {
            return (
              <Text style={styles.activityText}>{item.content}</Text>
            );
          }
          const isOutgoing = item.message_type === MessageType.outgoing;
          const quoted = item.content_attributes?.in_reply_to
            ? messageById.get(item.content_attributes.in_reply_to)
            : undefined;
          return (
            <Pressable onLongPress={() => setMessageMenuTarget(item)}>
              <View
                style={[
                  styles.bubble,
                  isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming,
                  item.private && styles.bubblePrivate,
                ]}
              >
                {quoted && (
                  <View style={styles.quotedBox}>
                    <Text
                      style={[
                        styles.quotedText,
                        isOutgoing ? styles.bubbleTextLight : styles.bubbleTextDark,
                      ]}
                      numberOfLines={1}
                    >
                      {formatMentionsForDisplay(quoted.content)}
                    </Text>
                  </View>
                )}
                {item.attachments?.map(attachment => (
                  <AttachmentView
                    key={attachment.id}
                    attachment={attachment}
                    tint={isOutgoing ? 'light' : 'dark'}
                    onPressImage={setViewingImageUri}
                  />
                ))}
                {!!item.content && (
                  <Text style={isOutgoing ? styles.bubbleTextLight : styles.bubbleTextDark}>
                    {formatMentionsForDisplay(item.content)}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        }}
      />

      {contactTyping && <Text style={styles.typingIndicator}>Contact is typing…</Text>}

      <View style={styles.composer}>
        {replyingTo && (
          <View style={styles.replyBanner}>
            <Text style={styles.replyBannerText} numberOfLines={1}>
              Replying to: {formatMentionsForDisplay(replyingTo.content)}
            </Text>
            <Pressable onPress={() => setReplyingTo(null)}>
              <Text style={styles.replyBannerClose}>×</Text>
            </Pressable>
          </View>
        )}

        {pendingAttachments.length > 0 && (
          <ScrollView horizontal style={styles.attachmentPreviewRow}>
            {pendingAttachments.map((attachment, index) => (
              <View key={attachment.uri} style={styles.attachmentThumbWrapper}>
                <Image source={{ uri: attachment.uri }} style={styles.attachmentThumb} />
                <Pressable
                  style={styles.attachmentRemove}
                  onPress={() =>
                    setPendingAttachments(prev => prev.filter((_, i) => i !== index))
                  }
                >
                  <Text style={styles.attachmentRemoveText}>×</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}

        {mentionSuggestions.length > 0 && (
          <ScrollView style={styles.mentionList} keyboardShouldPersistTaps="handled">
            {mentionSuggestions.map(agent => (
              <Pressable
                key={agent.id}
                style={styles.mentionRow}
                onPress={() => handleSelectMention(agent)}
              >
                <Text style={styles.mentionRowText}>{agent.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {voiceAttachment && (
          <View style={styles.voicePreview}>
            <Text style={styles.voicePreviewText}>🎤 Voice note recorded</Text>
            <Pressable onPress={() => setVoiceAttachment(null)}>
              <Text style={styles.replyBannerClose}>×</Text>
            </Pressable>
          </View>
        )}

        {isEmailConversation && (
          <Pressable
            style={styles.emailToggle}
            onPress={() => setEmailFieldsVisible(v => !v)}
          >
            <Text style={styles.emailToggleText}>
              {emailFieldsVisible ? 'Hide cc/bcc/to ▲' : 'Add cc/bcc/to ▼'}
            </Text>
          </Pressable>
        )}
        {isEmailConversation && emailFieldsVisible && (
          <View style={styles.emailFields}>
            <TextInput
              style={styles.emailInput}
              placeholder="To"
              placeholderTextColor={colors.textMuted}
              value={toEmails}
              onChangeText={setToEmails}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.emailInput}
              placeholder="Cc"
              placeholderTextColor={colors.textMuted}
              value={ccEmails}
              onChangeText={setCcEmails}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.emailInput}
              placeholder="Bcc"
              placeholderTextColor={colors.textMuted}
              value={bccEmails}
              onChangeText={setBccEmails}
              autoCapitalize="none"
            />
          </View>
        )}

        <View style={styles.privateRow}>
          <Text style={styles.privateLabel}>Private note</Text>
          <Switch value={isPrivate} onValueChange={setIsPrivate} />
        </View>
        <View style={styles.inputRow}>
          <Pressable style={styles.iconButton} onPress={() => handlePickImage(false)}>
            <Text style={styles.iconButtonText}>📎</Text>
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => handlePickImage(true)}>
            <Text style={styles.iconButtonText}>📷</Text>
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => setCannedSheetVisible(true)}>
            <Text style={styles.iconButtonText}>/</Text>
          </Pressable>
          <Pressable
            style={styles.iconButton}
            onPress={() => setCopilotSheetVisible(true)}
            disabled={copilotBusy}
          >
            <Text style={styles.iconButtonText}>{copilotBusy ? '…' : '✨'}</Text>
          </Pressable>
          <Pressable
            style={[styles.iconButton, recorderState.isRecording && styles.iconButtonActive]}
            onPress={handleToggleRecording}
          >
            <Text style={styles.iconButtonText}>{recorderState.isRecording ? '⏹' : '🎤'}</Text>
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder={isPrivate ? 'Write a private note…' : 'Reply to conversation…'}
            placeholderTextColor={colors.textMuted}
            value={draft}
            onChangeText={handleDraftChange}
            multiline
          />
          <Pressable
            style={styles.sendButton}
            onPress={handleSend}
            disabled={
              sending || (!draft.trim() && pendingAttachments.length === 0 && !voiceAttachment)
            }
          >
            <Text style={styles.sendButtonText}>{sending ? '…' : 'Send'}</Text>
          </Pressable>
        </View>
      </View>

      <OptionSheet
        visible={statusSheetVisible}
        title="Change status"
        options={STATUS_OPTIONS}
        onSelect={handleStatusChange}
        onClose={() => setStatusSheetVisible(false)}
      />
      <OptionSheet
        visible={prioritySheetVisible}
        title="Set priority"
        options={PRIORITY_OPTIONS}
        onSelect={handlePriorityChange}
        onClose={() => setPrioritySheetVisible(false)}
      />
      <AssignmentSheet
        visible={assignmentSheetVisible}
        agents={assignableAgents}
        teams={teams}
        onSelectAgent={handleSelectAssigneeAgent}
        onSelectTeam={handleSelectAssigneeTeam}
        onClose={() => setAssignmentSheetVisible(false)}
      />
      <MultiSelectSheet
        visible={labelSheetVisible}
        title="Labels"
        options={accountLabels.map(l => ({ label: l.title, value: l }))}
        initialSelected={accountLabels.filter(l => conversation?.labels.includes(l.title))}
        keyExtractor={label => String(label.id)}
        onConfirm={handleLabelsConfirm}
        onClose={() => setLabelSheetVisible(false)}
      />
      <MultiSelectSheet
        visible={participantSheetVisible}
        title="Participants"
        options={assignableAgents.map(a => ({ label: a.name, value: a, subtitle: a.email }))}
        initialSelected={participants}
        keyExtractor={agent => String(agent.id)}
        onConfirm={handleParticipantsConfirm}
        onClose={() => setParticipantSheetVisible(false)}
      />
      {accountId && (
        <CannedResponseSheet
          visible={cannedSheetVisible}
          accountId={accountId}
          onSelect={content => setDraft(prev => (prev ? `${prev} ${content}` : content))}
          onClose={() => setCannedSheetVisible(false)}
        />
      )}
      <OptionSheet
        visible={!!messageMenuTarget}
        title="Message"
        options={[
          { label: 'Reply', value: 'reply' as const },
          { label: 'Copy', value: 'copy' as const },
          ...(messageMenuTarget?.message_type === MessageType.outgoing
            ? [{ label: 'Delete', value: 'delete' as const }]
            : []),
        ]}
        onSelect={action => {
          if (!messageMenuTarget) return;
          if (action === 'reply') setReplyingTo(messageMenuTarget);
          if (action === 'copy') handleCopyMessage(messageMenuTarget);
          if (action === 'delete') handleDeleteMessage(messageMenuTarget);
        }}
        onClose={() => setMessageMenuTarget(null)}
      />
      <OptionSheet
        visible={copilotSheetVisible}
        title="Copilot"
        options={[
          { label: 'Suggest reply', value: 'suggest_reply' as const },
          { label: 'Summarize conversation', value: 'summarize' as const },
          { label: 'Fix spelling & grammar', value: 'fix_spelling_grammar' as const },
          { label: 'Improve writing', value: 'improve' as const },
          { label: 'Rewrite: Casual tone', value: 'casual' as const },
          { label: 'Rewrite: Professional tone', value: 'professional' as const },
          { label: 'Rewrite: Friendly tone', value: 'friendly' as const },
          { label: 'Rewrite: Confident tone', value: 'confident' as const },
          { label: 'Rewrite: Straightforward tone', value: 'straightforward' as const },
        ]}
        onSelect={handleCopilotAction}
        onClose={() => setCopilotSheetVisible(false)}
      />
      <ImageViewerModal uri={viewingImageUri} onClose={() => setViewingImageUri(null)} />
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    actionsRow: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      padding: 8,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.chipBg,
      borderRadius: 8,
      marginRight: 8,
      justifyContent: 'center',
    },
    actionButtonText: { fontSize: 13, color: colors.chipText, fontWeight: '500' },
    messageList: { padding: 12, gap: 8 },
    activityText: {
      textAlign: 'center',
      color: colors.textMuted,
      fontSize: 12,
      marginVertical: 8,
    },
    bubble: {
      maxWidth: '80%',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 8,
    },
    bubbleIncoming: { backgroundColor: colors.chipBg, alignSelf: 'flex-start' },
    bubbleOutgoing: { backgroundColor: colors.accent, alignSelf: 'flex-end' },
    bubblePrivate: { backgroundColor: colors.warningBg },
    bubbleTextDark: { color: colors.textPrimary },
    bubbleTextLight: { color: colors.accentText },
    quotedBox: {
      borderLeftWidth: 2,
      borderLeftColor: colors.textMuted,
      paddingLeft: 6,
      marginBottom: 4,
      opacity: 0.7,
    },
    quotedText: { fontSize: 12, fontStyle: 'italic' },
    typingIndicator: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      color: colors.textMuted,
      fontSize: 12,
      fontStyle: 'italic',
    },
    composer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      padding: 8,
    },
    replyBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.chipBg,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginBottom: 8,
    },
    replyBannerText: { flex: 1, fontSize: 12, color: colors.chipText },
    replyBannerClose: { fontSize: 16, color: colors.textMuted, marginLeft: 8 },
    attachmentPreviewRow: { marginBottom: 8 },
    attachmentThumbWrapper: { marginRight: 8 },
    attachmentThumb: { width: 60, height: 60, borderRadius: 8 },
    attachmentRemove: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: colors.textPrimary,
      borderRadius: 10,
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    attachmentRemoveText: { color: colors.background, fontSize: 13, lineHeight: 14 },
    mentionList: {
      maxHeight: 140,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      marginBottom: 8,
    },
    mentionRow: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    mentionRowText: { fontSize: 14, color: colors.textPrimary },
    privateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 8,
      marginBottom: 4,
    },
    privateLabel: { fontSize: 12, color: colors.textMuted },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.chipBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconButtonText: { fontSize: 16 },
    iconButtonActive: { backgroundColor: colors.warningBg },
    voicePreview: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.chipBg,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginBottom: 8,
    },
    voicePreviewText: { fontSize: 13, color: colors.chipText },
    emailToggle: { paddingVertical: 4, marginBottom: 4 },
    emailToggleText: { fontSize: 12, color: colors.accent, fontWeight: '600' },
    emailFields: { gap: 6, marginBottom: 8 },
    emailInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      fontSize: 13,
      color: colors.textPrimary,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      maxHeight: 100,
      color: colors.textPrimary,
    },
    sendButton: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    sendButtonText: { color: colors.accentText, fontWeight: '600' },
  });
