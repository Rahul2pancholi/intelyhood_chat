import { apiClient } from './client';

export type ConversationStatus = 'open' | 'resolved' | 'pending' | 'snoozed';
export type ConversationPriority = 'low' | 'medium' | 'high' | 'urgent' | null;
export type AssigneeType = 'me' | 'unassigned' | 'assigned';

export type ConversationSender = {
  id: number;
  name: string;
  email?: string;
  thumbnail?: string;
};

export type Conversation = {
  id: number;
  account_id: number;
  inbox_id: number;
  status: ConversationStatus;
  priority: ConversationPriority;
  unread_count: number;
  labels: string[];
  muted: boolean;
  last_activity_at: number;
  snoozed_until: number | null;
  additional_attributes: Record<string, unknown>;
  meta: {
    sender: ConversationSender;
    assignee: ConversationSender | null;
    channel: string;
  };
  last_non_activity_message?: {
    content: string | null;
  };
};

export type Agent = {
  id: number;
  name: string;
  email: string;
  thumbnail: string;
  role: string;
};

export type ConversationsMeta = {
  mine_count: number;
  assigned_count: number;
  unassigned_count: number;
  all_count: number;
};

export type ConversationType = 'mention' | 'participating' | 'unattended';

export type FetchConversationsParams = {
  accountId: number;
  status?: ConversationStatus | 'all';
  assigneeType?: AssigneeType;
  conversationType?: ConversationType;
  inboxId?: number;
  page?: number;
};

export async function fetchConversations({
  accountId,
  status = 'open',
  assigneeType,
  conversationType,
  inboxId,
  page = 1,
}: FetchConversationsParams): Promise<{ meta: ConversationsMeta; payload: Conversation[] }> {
  const response = await apiClient.get(`/api/v1/accounts/${accountId}/conversations`, {
    // conversation_type (mention/participating/unattended) takes precedence over
    // assignee_type in ConversationFinder — only send one or the other.
    params: conversationType
      ? { status, conversation_type: conversationType, inbox_id: inboxId, page }
      : { status, assignee_type: assigneeType, inbox_id: inboxId, page },
  });
  return response.data.data;
}

export async function toggleConversationStatus(
  accountId: number,
  conversationId: number,
  status: ConversationStatus,
  snoozedUntil?: string,
): Promise<void> {
  await apiClient.post(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/toggle_status`,
    { status, snoozed_until: snoozedUntil },
  );
}

export async function toggleConversationPriority(
  accountId: number,
  conversationId: number,
  priority: ConversationPriority,
): Promise<void> {
  await apiClient.post(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/toggle_priority`,
    { priority },
  );
}

export async function fetchConversation(
  accountId: number,
  conversationId: number,
): Promise<Conversation> {
  const response = await apiClient.get(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}`,
  );
  return response.data;
}

export async function assignConversationToUser(
  accountId: number,
  conversationId: number,
  assigneeId: number,
): Promise<void> {
  await apiClient.post(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/assignments`,
    { assignee_id: assigneeId },
  );
}

export async function assignConversationToTeam(
  accountId: number,
  conversationId: number,
  teamId: number,
): Promise<void> {
  await apiClient.post(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/assignments`,
    { team_id: teamId },
  );
}

export async function updateConversationLabels(
  accountId: number,
  conversationId: number,
  labels: string[],
): Promise<void> {
  await apiClient.post(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/labels`,
    { labels },
  );
}

export async function fetchAssignableAgents(accountId: number, inboxId: number): Promise<Agent[]> {
  const response = await apiClient.get(`/api/v1/accounts/${accountId}/assignable_agents`, {
    params: { inbox_ids: [inboxId] },
  });
  return response.data.payload;
}

export async function fetchConversationParticipants(
  accountId: number,
  conversationId: number,
): Promise<Agent[]> {
  const response = await apiClient.get(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/participants`,
  );
  return response.data;
}

export async function updateConversationParticipants(
  accountId: number,
  conversationId: number,
  userIds: number[],
): Promise<Agent[]> {
  const response = await apiClient.patch(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/participants`,
    { user_ids: userIds },
  );
  return response.data;
}

export async function toggleTypingStatus(
  accountId: number,
  conversationId: number,
  status: 'on' | 'off',
  isPrivate: boolean,
): Promise<void> {
  await apiClient.post(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/toggle_typing_status`,
    { typing_status: status, is_private: isPrivate },
  );
}

export async function muteConversation(accountId: number, conversationId: number): Promise<void> {
  await apiClient.post(`/api/v1/accounts/${accountId}/conversations/${conversationId}/mute`);
}

export async function unmuteConversation(accountId: number, conversationId: number): Promise<void> {
  await apiClient.post(`/api/v1/accounts/${accountId}/conversations/${conversationId}/unmute`);
}
