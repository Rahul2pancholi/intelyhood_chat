import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';
import ConversationsStackNavigator from './ConversationsStackNavigator';
import ContactsStackNavigator from './ContactsStackNavigator';
import NotificationsStackNavigator from './NotificationsStackNavigator';
import ProfileScreen from '../screens/ProfileScreen';
import ReportsScreen from '../screens/ReportsScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const user = useAuthStore(state => state.user);
  const activeAccountId = useAuthStore(state => state.activeAccountId);
  // Reports are gated server-side to administrators (ReportPolicy#view?) — hide
  // the tab entirely for other roles rather than showing a 403.
  const isAdmin = user?.accounts.find(a => a.id === activeAccountId)?.role === 'administrator';

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Conversations" component={ConversationsStackNavigator} />
      <Tab.Screen name="Contacts" component={ContactsStackNavigator} />
      <Tab.Screen name="Notifications" component={NotificationsStackNavigator} />
      {isAdmin && (
        <Tab.Screen name="Reports" component={ReportsScreen} options={{ headerShown: true }} />
      )}
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true }} />
    </Tab.Navigator>
  );
}
