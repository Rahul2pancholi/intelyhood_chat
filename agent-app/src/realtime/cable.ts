import { createConsumer, type Consumer, type Subscription } from '@rails/actioncable';
import { API_BASE_URL } from '../config/env';
import { useAuthStore } from '../store/authStore';

export type RoomEvent = { event: string; data: any };
type Listener = (event: RoomEvent) => void;

const listeners = new Set<Listener>();
let consumer: Consumer | null = null;
let subscription: Subscription | null = null;
let presenceInterval: ReturnType<typeof setInterval> | null = null;

function websocketUrl(): string {
  return `${API_BASE_URL.replace(/^http/, 'ws')}/cable`;
}

// Always tears down any existing subscription first, so switching the active
// account (see authStore.switchAccount) can just call this again to resubscribe
// with the new account_id.
export function connectCable(): void {
  disconnectCable();
  const { user, activeAccountId } = useAuthStore.getState();
  if (!user || !activeAccountId) return;

  consumer = createConsumer(websocketUrl());
  subscription = consumer.subscriptions.create(
    {
      channel: 'RoomChannel',
      pubsub_token: user.pubsub_token,
      account_id: activeAccountId,
      user_id: user.id,
    },
    {
      received: data => {
        listeners.forEach(listener => listener(data as RoomEvent));
      },
    },
  );

  // Mirrors the dashboard's presence heartbeat (see BaseActionCableConnector.js).
  presenceInterval = setInterval(() => subscription?.perform('update_presence'), 20000);
}

export function disconnectCable(): void {
  if (presenceInterval) clearInterval(presenceInterval);
  presenceInterval = null;
  subscription?.unsubscribe();
  subscription = null;
  consumer?.disconnect();
  consumer = null;
}

export function onRoomEvent(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
