import { apiClient } from './client';

export type Notification = {
  id: number;
  notification_type: string;
  push_message_title: string;
  push_message_body: string;
  primary_actor_type: string;
  primary_actor_id: number;
  // Conversation actor: { id } is the conversation's display_id.
  // Message actor: { id } is the message id, conversation_id is the conversation's display_id.
  primary_actor: { id: number; conversation_id?: number } | null;
  read_at: number | null;
  created_at: number;
};

export type NotificationsMeta = { unread_count: number; count: number; current_page: number };

export async function fetchNotifications(
  accountId: number,
  page = 1,
): Promise<{ meta: NotificationsMeta; payload: Notification[] }> {
  const response = await apiClient.get(`/api/v1/accounts/${accountId}/notifications`, {
    params: { page },
  });
  return response.data.data;
}

// Conversation-type notifications carry the display_id as primary_actor.id;
// Message-type ones carry it as primary_actor.conversation_id instead.
export function resolveConversationId(notification: Notification): number | undefined {
  if (notification.primary_actor_type === 'Conversation') {
    return notification.primary_actor?.id;
  }
  return notification.primary_actor?.conversation_id;
}

export async function markNotificationRead(accountId: number, id: number): Promise<void> {
  await apiClient.patch(`/api/v1/accounts/${accountId}/notifications/${id}`);
}

export async function markAllNotificationsRead(accountId: number): Promise<void> {
  await apiClient.post(`/api/v1/accounts/${accountId}/notifications/read_all`);
}
