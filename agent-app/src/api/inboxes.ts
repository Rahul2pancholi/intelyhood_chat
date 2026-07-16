import { apiClient } from './client';

export type Inbox = {
  id: number;
  name: string;
  channel_type: string;
};

export async function fetchInboxes(accountId: number): Promise<Inbox[]> {
  const response = await apiClient.get(`/api/v1/accounts/${accountId}/inboxes`);
  return response.data.payload;
}
