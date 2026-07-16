import { apiClient } from './client';
import type { ConversationSender } from './conversations';

export const MessageType = { incoming: 0, outgoing: 1, activity: 2, template: 3 } as const;

export type Message = {
  id: number;
  content: string | null;
  message_type: number;
  content_type: string;
  private: boolean;
  created_at: number;
  conversation_id: number;
  content_attributes?: { in_reply_to?: number };
  sender?: ConversationSender & { type?: string };
  attachments?: Array<{ id: number; file_type: string; data_url: string }>;
};

export async function fetchMessages(
  accountId: number,
  conversationId: number,
  before?: number,
): Promise<Message[]> {
  const response = await apiClient.get(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
    { params: before ? { before } : {} },
  );
  return response.data.payload;
}

export type PickedAttachment = { uri: string; name: string; mimeType: string };

// Attaches raw files as multipart form fields — MessageBuilder accepts either a
// signed_id string (direct-upload flow) or an uploaded file object directly, so
// this skips the separate direct_uploads round trip.
export type SendMessageOptions = {
  attachments?: PickedAttachment[];
  inReplyTo?: number;
  isVoiceMessage?: boolean;
  // Only honored by the backend when the conversation's inbox is a Channel::Email
  // (see Messages::MessageBuilder#process_emails) — comma-separated address strings.
  ccEmails?: string;
  bccEmails?: string;
  toEmails?: string;
};

export async function sendMessage(
  accountId: number,
  conversationId: number,
  content: string,
  isPrivate: boolean,
  options: SendMessageOptions = {},
): Promise<Message> {
  const { attachments = [], inReplyTo, isVoiceMessage, ccEmails, bccEmails, toEmails } = options;
  const url = `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;

  if (attachments.length === 0) {
    const response = await apiClient.post(url, {
      content,
      private: isPrivate,
      content_attributes: inReplyTo ? { in_reply_to: inReplyTo } : undefined,
      cc_emails: ccEmails,
      bcc_emails: bccEmails,
      to_emails: toEmails,
    });
    return response.data;
  }

  const form = new FormData();
  form.append('content', content);
  form.append('private', String(isPrivate));
  if (inReplyTo) form.append('content_attributes[in_reply_to]', String(inReplyTo));
  if (isVoiceMessage) form.append('is_voice_message', 'true');
  if (ccEmails) form.append('cc_emails', ccEmails);
  if (bccEmails) form.append('bcc_emails', bccEmails);
  if (toEmails) form.append('to_emails', toEmails);
  attachments.forEach(attachment => {
    // React Native's FormData file shape, not the web File API.
    form.append('attachments[]', {
      uri: attachment.uri,
      name: attachment.name,
      type: attachment.mimeType,
    } as unknown as Blob);
  });

  const response = await apiClient.post(url, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

// Soft-delete: backend replaces content with a "deleted" placeholder rather
// than removing the row (see messages_controller.rb#destroy).
export async function deleteMessage(
  accountId: number,
  conversationId: number,
  messageId: number,
): Promise<void> {
  await apiClient.delete(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages/${messageId}`,
  );
}
