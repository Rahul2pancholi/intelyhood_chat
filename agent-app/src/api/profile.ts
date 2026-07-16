import { apiClient } from './client';

export type Availability = 'online' | 'busy' | 'offline';

export async function setAvailability(accountId: number, availability: Availability): Promise<void> {
  await apiClient.post('/api/v1/profile/availability', {
    profile: { account_id: accountId, availability },
  });
}

export async function setAutoOffline(accountId: number, autoOffline: boolean): Promise<void> {
  await apiClient.post('/api/v1/profile/auto_offline', {
    profile: { account_id: accountId, auto_offline: autoOffline },
  });
}

export type NotificationSettings = {
  id: number;
  all_push_flags: string[];
  selected_push_flags: string[];
};

export async function fetchNotificationSettings(accountId: number): Promise<NotificationSettings> {
  const response = await apiClient.get(`/api/v1/accounts/${accountId}/notification_settings`);
  return response.data;
}

export async function updateSelectedPushFlags(
  accountId: number,
  selectedPushFlags: string[],
): Promise<void> {
  await apiClient.patch(`/api/v1/accounts/${accountId}/notification_settings`, {
    notification_settings: { selected_push_flags: selectedPushFlags },
  });
}
