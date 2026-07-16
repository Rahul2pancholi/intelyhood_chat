import { Platform } from 'react-native';
import * as Application from 'expo-application';
import messaging, {
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { registerPushSubscription, unregisterPushSubscription } from '../api/pushSubscriptions';
import { navigateToConversation } from '../navigation/navigationRef';

// Wire format sent by Notification::PushNotificationService#fcm_data:
// data.payload is a JSON string of { data: { notification: <fcm_push_data> } },
// where fcm_push_data.primary_actor holds either { id } (Conversation) or
// { id, conversation_id } (Message) — see api/notifications.ts#resolveConversationId.
function extractConversationId(data: FirebaseMessagingTypes.RemoteMessage['data']): number | undefined {
  const raw = data?.payload;
  if (typeof raw !== 'string') return undefined;
  try {
    const primaryActor = JSON.parse(raw)?.data?.notification?.primary_actor;
    return primaryActor?.conversation_id ?? primaryActor?.id;
  } catch {
    return undefined;
  }
}

async function getDeviceId(): Promise<string | null> {
  if (Platform.OS === 'android') return Application.getAndroidId();
  if (Platform.OS === 'ios') return Application.getIosIdForVendorAsync();
  return null;
}

let currentToken: string | null = null;

export async function registerForPushNotifications(): Promise<void> {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  if (!enabled) return;

  await notifee.requestPermission();

  const deviceId = await getDeviceId();
  const token = await messaging().getToken();
  if (!deviceId || !token) return;

  currentToken = token;
  await registerPushSubscription(deviceId, token);
}

export async function unregisterPushNotifications(): Promise<void> {
  if (!currentToken) return;
  await unregisterPushSubscription(currentToken);
  currentToken = null;
}

function handleTap(data: FirebaseMessagingTypes.RemoteMessage['data']): void {
  const conversationId = extractConversationId(data);
  if (conversationId) navigateToConversation(conversationId);
}

export function setupPushHandlers(): () => void {
  // App in background/quit, tapped the OS-rendered notification.
  const unsubscribeOpenedApp = messaging().onNotificationOpenedApp(remoteMessage =>
    handleTap(remoteMessage.data),
  );
  messaging()
    .getInitialNotification()
    .then(remoteMessage => remoteMessage && handleTap(remoteMessage.data));

  // App in foreground: FCM doesn't auto-display, so notifee shows it manually,
  // and its own foreground-event stream tells us about taps on that display.
  const unsubscribeForegroundMessage = messaging().onMessage(async remoteMessage => {
    await notifee.displayNotification({
      title: remoteMessage.notification?.title,
      body: remoteMessage.notification?.body,
      data: remoteMessage.data,
    });
  });
  const unsubscribeForegroundEvent = notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) handleTap(detail.notification?.data as any);
  });

  return () => {
    unsubscribeOpenedApp();
    unsubscribeForegroundMessage();
    unsubscribeForegroundEvent();
  };
}
