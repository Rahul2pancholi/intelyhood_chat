import { apiClient } from './client';

export type CannedResponse = {
  id: number;
  short_code: string;
  content: string;
};

export async function fetchCannedResponses(
  accountId: number,
  search?: string,
): Promise<CannedResponse[]> {
  const response = await apiClient.get(`/api/v1/accounts/${accountId}/canned_responses`, {
    params: search ? { search } : {},
  });
  return response.data;
}
