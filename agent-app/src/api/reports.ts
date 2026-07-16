import { apiClient } from './client';

export type ConversationSummary = {
  conversations_count: number;
  incoming_messages_count: number;
  outgoing_messages_count: number;
  avg_first_response_time: number | null;
  avg_resolution_time: number | null;
  resolutions_count: number;
  reply_time: number | null;
};

export async function fetchConversationSummary(
  accountId: number,
  since: number,
  until: number,
): Promise<ConversationSummary> {
  const response = await apiClient.get(`/api/v2/accounts/${accountId}/reports/summary`, {
    // type: 'account' — required by ReportsController#common_params (params[:type].to_sym),
    // scopes the summary to the whole account rather than one agent/inbox/team/label.
    params: { since, until, type: 'account' },
  });
  return response.data;
}
