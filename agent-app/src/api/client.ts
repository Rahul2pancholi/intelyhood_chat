import axios from 'axios';
import { API_BASE_URL } from '../config/env';
import { loadTokens, saveTokens, type AuthTokens } from './authTokens';

export const apiClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.request.use(async config => {
  const tokens = await loadTokens();
  if (tokens) {
    config.headers['access-token'] = tokens.accessToken;
    config.headers.client = tokens.client;
    config.headers.uid = tokens.uid;
  }
  return config;
});

// devise_token_auth is configured with change_headers_on_each_request = false,
// so tokens don't rotate per-request — but persist them if the server ever sends new ones.
apiClient.interceptors.response.use(async response => {
  const { 'access-token': accessToken, client, uid } = response.headers;
  if (accessToken && client && uid) {
    await saveTokens({ accessToken, client, uid } as AuthTokens);
  }
  return response;
});
