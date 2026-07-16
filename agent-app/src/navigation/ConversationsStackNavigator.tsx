import { Pressable, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ConversationsListScreen from '../screens/ConversationsListScreen';
import ConversationDetailScreen from '../screens/ConversationDetailScreen';
import SearchScreen from '../screens/SearchScreen';
import type { ConversationDetailParams } from './types';

export type ConversationsStackParamList = {
  ConversationsList: undefined;
  ConversationDetail: ConversationDetailParams;
  Search: undefined;
};

const Stack = createNativeStackNavigator<ConversationsStackParamList>();

function SearchButton({ navigation }: { navigation: any }) {
  return (
    <Pressable onPress={() => navigation.navigate('Search')}>
      <Text style={{ fontSize: 18 }}>🔍</Text>
    </Pressable>
  );
}

export default function ConversationsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ConversationsList"
        component={ConversationsListScreen}
        options={({ navigation }) => ({
          title: 'Conversations',
          headerRight: () => <SearchButton navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="ConversationDetail"
        component={ConversationDetailScreen}
        options={{ title: 'Conversation' }}
      />
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} />
    </Stack.Navigator>
  );
}
