import { apiClient } from './client';
import type { Message } from './messages';

export type SearchConversationResult = {
  id: number;
  account_id: number;
  created_at: number;
  message: Message | null;
  contact: { id: number; name: string } | null;
  inbox: { id: number; name: string } | null;
  agent: { id: number; name: string } | null;
};

export type SearchContactResult = {
  id: number;
  name: string;
  email: string | null;
  phone_number: string | null;
};

export type SearchResults = {
  conversations: SearchConversationResult[];
  contacts: SearchContactResult[];
  messages: Message[];
};

export async function searchAll(accountId: number, query: string): Promise<SearchResults> {
  const response = await apiClient.get(`/api/v1/accounts/${accountId}/search`, {
    params: { q: query },
  });
  return response.data.payload;
}
