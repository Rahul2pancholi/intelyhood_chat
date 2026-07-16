import { apiClient } from './client';

export type RewriteOperation =
  | 'fix_spelling_grammar'
  | 'improve'
  | 'casual'
  | 'professional'
  | 'friendly'
  | 'confident'
  | 'straightforward';

type TaskResult = { message: string | null; error?: string };

// Requires CAPTAIN_OPEN_AI_API_KEY configured via Super Admin > App Configs —
// without it, these resolve with { error: 'captain.api_key_missing' } (see
// lib/captain/base_task_service.rb), not a thrown exception.
export async function rewriteContent(
  accountId: number,
  content: string,
  operation: RewriteOperation,
  conversationDisplayId: number,
): Promise<TaskResult> {
  const response = await apiClient.post(`/api/v1/accounts/${accountId}/captain/tasks/rewrite`, {
    content,
    operation,
    conversation_display_id: conversationDisplayId,
  });
  return response.data;
}

export async function suggestReply(
  accountId: number,
  conversationDisplayId: number,
): Promise<TaskResult> {
  const response = await apiClient.post(
    `/api/v1/accounts/${accountId}/captain/tasks/reply_suggestion`,
    { conversation_display_id: conversationDisplayId },
  );
  return response.data;
}

export async function summarizeConversation(
  accountId: number,
  conversationDisplayId: number,
): Promise<TaskResult> {
  const response = await apiClient.post(
    `/api/v1/accounts/${accountId}/captain/tasks/summarize`,
    { conversation_display_id: conversationDisplayId },
  );
  return response.data;
}
