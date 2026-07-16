import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigateToConversation(conversationId: number): void {
  if (!navigationRef.isReady()) return;
  // Every tab stack that can show a conversation registers a
  // 'ConversationDetail' screen under the same name (see navigation/types.ts).
  // Cast needed: the ref has no shared ParamList across the tab stacks it can target.
  (navigationRef.navigate as (name: string, params: object) => void)('ConversationDetail', {
    conversationId,
  });
}
