import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NotificationsListScreen from '../screens/NotificationsListScreen';
import ConversationDetailScreen from '../screens/ConversationDetailScreen';
import type { ConversationDetailParams } from './types';

export type NotificationsStackParamList = {
  NotificationsList: undefined;
  ConversationDetail: ConversationDetailParams;
};

const Stack = createNativeStackNavigator<NotificationsStackParamList>();

export default function NotificationsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="NotificationsList"
        component={NotificationsListScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="ConversationDetail"
        component={ConversationDetailScreen}
        options={{ title: 'Conversation' }}
      />
    </Stack.Navigator>
  );
}
