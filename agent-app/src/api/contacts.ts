import { apiClient } from './client';
import type { Conversation } from './conversations';

export type Contact = {
  id: number;
  name: string;
  email: string | null;
  phone_number: string | null;
  thumbnail: string;
  availability_status: string;
  last_activity_at: number;
  additional_attributes: Record<string, unknown>;
  custom_attributes: Record<string, unknown>;
};

export type ContactsMeta = { count: number; current_page: number };

export async function fetchContacts(
  accountId: number,
  page = 1,
): Promise<{ meta: ContactsMeta; payload: Contact[] }> {
  const response = await apiClient.get(`/api/v1/accounts/${accountId}/contacts`, {
    params: { page },
  });
  return response.data;
}

export async function fetchContact(accountId: number, contactId: number): Promise<Contact> {
  const response = await apiClient.get(`/api/v1/accounts/${accountId}/contacts/${contactId}`);
  return response.data.payload;
}

export async function searchContacts(
  accountId: number,
  query: string,
  page = 1,
): Promise<{ payload: Contact[] }> {
  const response = await apiClient.get(`/api/v1/accounts/${accountId}/contacts/search`, {
    params: { q: query, page },
  });
  return response.data;
}

export async function fetchContactConversations(
  accountId: number,
  contactId: number,
): Promise<{ payload: Conversation[] }> {
  const response = await apiClient.get(
    `/api/v1/accounts/${accountId}/contacts/${contactId}/conversations`,
  );
  return response.data;
}
