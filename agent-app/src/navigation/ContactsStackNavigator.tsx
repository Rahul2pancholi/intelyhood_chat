import { Pressable, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ContactsListScreen from '../screens/ContactsListScreen';
import ContactDetailScreen from '../screens/ContactDetailScreen';
import ContactFormScreen from '../screens/ContactFormScreen';
import ConversationDetailScreen from '../screens/ConversationDetailScreen';
import { useTheme } from '../theme/useTheme';
import type { ConversationDetailParams } from './types';

export type ContactsStackParamList = {
  ContactsList: undefined;
  ContactDetail: { contactId: number };
  ContactForm: { contactId?: number } | undefined;
  ConversationDetail: ConversationDetailParams;
};

const Stack = createNativeStackNavigator<ContactsStackParamList>();

function AddContactButton({ navigation }: { navigation: any }) {
  return (
    <Pressable onPress={() => navigation.navigate('ContactForm')}>
      <Text style={{ fontSize: 22 }}>＋</Text>
    </Pressable>
  );
}

function EditContactButton({ navigation, route }: { navigation: any; route: any }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => navigation.navigate('ContactForm', { contactId: route.params.contactId })}
    >
      <Text style={{ color: colors.accent, fontWeight: '600' }}>Edit</Text>
    </Pressable>
  );
}

export default function ContactsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ContactsList"
        component={ContactsListScreen}
        options={({ navigation }) => ({
          title: 'Contacts',
          headerRight: () => <AddContactButton navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="ContactDetail"
        component={ContactDetailScreen}
        options={({ navigation, route }) => ({
          title: 'Contact',
          headerRight: () => <EditContactButton navigation={navigation} route={route} />,
        })}
      />
      <Stack.Screen
        name="ContactForm"
        component={ContactFormScreen}
        options={({ route }) => ({ title: route.params?.contactId ? 'Edit contact' : 'New contact' })}
      />
      <Stack.Screen
        name="ConversationDetail"
        component={ConversationDetailScreen}
        options={{ title: 'Conversation' }}
      />
    </Stack.Navigator>
  );
}
