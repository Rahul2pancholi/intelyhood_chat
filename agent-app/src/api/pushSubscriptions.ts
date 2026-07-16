import { apiClient } from './client';

export async function registerPushSubscription(deviceId: string, pushToken: string): Promise<void> {
  await apiClient.post('/api/v1/notification_subscriptions', {
    notification_subscription: {
      subscription_type: 'fcm',
      subscription_attributes: { device_id: deviceId, push_token: pushToken },
    },
  });
}

export async function unregisterPushSubscription(pushToken: string): Promise<void> {
  await apiClient.delete('/api/v1/notification_subscriptions', { params: { push_token: pushToken } });
}
