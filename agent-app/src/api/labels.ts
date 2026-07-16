import { apiClient } from './client';

export type Label = {
  id: number;
  title: string;
  description: string;
  color: string;
};

export async function fetchAccountLabels(accountId: number): Promise<Label[]> {
  const response = await apiClient.get(`/api/v1/accounts/${accountId}/labels`);
  return response.data.payload;
}
