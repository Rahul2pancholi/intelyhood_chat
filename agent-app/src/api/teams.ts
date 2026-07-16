import { apiClient } from './client';

export type Team = {
  id: number;
  name: string;
  description: string;
};

export async function fetchTeams(accountId: number): Promise<Team[]> {
  const response = await apiClient.get(`/api/v1/accounts/${accountId}/teams`);
  return response.data;
}
