declare module '@rails/actioncable' {
  export type Subscription = {
    unsubscribe: () => void;
    perform: (action: string, data?: Record<string, unknown>) => void;
  };

  export type SubscriptionHandlers = {
    connected?: () => void;
    disconnected?: () => void;
    received?: (data: unknown) => void;
  };

  export type Consumer = {
    subscriptions: {
      create: (
        params: Record<string, unknown>,
        handlers: SubscriptionHandlers,
      ) => Subscription;
    };
    disconnect: () => void;
  };

  export function createConsumer(url: string): Consumer;
}
