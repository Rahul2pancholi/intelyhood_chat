import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ContactsListScreen from '../screens/ContactsListScreen';
import ContactDetailScreen from '../screens/ContactDetailScreen';
import ConversationDetailScreen from '../screens/ConversationDetailScreen';
import type { ConversationDetailParams } from './types';

export type ContactsStackParamList = {
  ContactsList: undefined;
  ContactDetail: { contactId: number };
  ConversationDetail: ConversationDetailParams;
};

const Stack = createNativeStackNavigator<ContactsStackParamList>();

export default function ContactsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ContactsList"
        component={ContactsListScreen}
        options={{ title: 'Contacts' }}
      />
      <Stack.Screen
        name="ContactDetail"
        component={ContactDetailScreen}
        options={{ title: 'Contact' }}
      />
      <Stack.Screen
        name="ConversationDetail"
        component={ConversationDetailScreen}
        options={{ title: 'Conversation' }}
      />
    </Stack.Navigator>
  );
}
