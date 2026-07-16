import { apiClient } from './client';

export type Account = {
  id: number;
  name: string;
  role: string;
  availability: 'online' | 'busy' | 'offline';
};

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  account_id: number;
  pubsub_token: string;
  avatar_url: string;
  accounts: Account[];
};

export type SignInResult = {
  user: CurrentUser;
  tokens: { accessToken: string; client: string; uid: string };
};

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const response = await apiClient.post('/auth/sign_in', { email, password });
  const { 'access-token': accessToken, client, uid } = response.headers;
  return {
    user: response.data.data,
    tokens: { accessToken, client, uid },
  };
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await apiClient.get('/api/v1/profile');
  return response.data;
}
