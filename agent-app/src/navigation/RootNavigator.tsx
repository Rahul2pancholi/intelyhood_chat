import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme/useTheme';
import { connectCable, disconnectCable } from '../realtime/cable';
import {
  registerForPushNotifications,
  setupPushHandlers,
  unregisterPushNotifications,
} from '../notifications/push';
import { navigationRef } from './navigationRef';
import LoginScreen from '../screens/LoginScreen';
import MainTabNavigator from './MainTabNavigator';

export default function RootNavigator() {
  const status = useAuthStore(state => state.status);
  const activeAccountId = useAuthStore(state => state.activeAccountId);
  const restoreSession = useAuthStore(state => state.restoreSession);
  const { isDark } = useTheme();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (status === 'signedIn') {
      connectCable();
      registerForPushNotifications();
    } else {
      disconnectCable();
      unregisterPushNotifications();
    }
    // activeAccountId dependency: reconnects the RoomChannel scoped to the
    // newly active account when switchAccount() is called (see ProfileScreen).
  }, [status, activeAccountId]);

  // Push tap handlers stay registered for the app's lifetime, independent of auth state.
  useEffect(() => setupPushHandlers(), []);

  if (status === 'checking') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={isDark ? DarkTheme : DefaultTheme}>
      {status === 'signedIn' ? <MainTabNavigator /> : <LoginScreen />}
    </NavigationContainer>
  );
}
