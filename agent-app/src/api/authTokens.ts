import * as SecureStore from 'expo-secure-store';

export type AuthTokens = {
  accessToken: string;
  client: string;
  uid: string;
};

const STORAGE_KEY = 'chatwoot_auth_tokens';

export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(tokens));
}

export async function loadTokens(): Promise<AuthTokens | null> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}
