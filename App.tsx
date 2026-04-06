import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';

import { SplashScreen } from './src/screens/SplashScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ConfigScreen } from './src/screens/ConfigScreen';
import { ActiveScreen } from './src/screens/ActiveScreen';
import { DoneScreen } from './src/screens/DoneScreen';
import { SavedPresetsScreen } from './src/screens/SavedPresetsScreen';

import { useTimerStore } from './src/store/timerStore';
import { initNotifications } from './src/notifications/notificationService';
import { decodeProtocol } from './src/domain/protocol';
import { colors } from './src/theme';

export type RootStackParamList = {
  Home: undefined;
  Config: { protocol?: { label: string; sections: any[] } } | undefined;
  Active: undefined;
  Done: undefined;
  SavedPresets: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const { hydrate, applyElapsed, setSections, phase } = useTimerStore();

  // Initialisation au démarrage
  useEffect(() => {
    hydrate();
    initNotifications();
  }, []);

  // Reprendre le timer quand l'app revient au premier plan
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        applyElapsed();
      }
    });
    return () => sub.remove();
  }, []);

  // Deep links
  function handleDeepLink(url: string) {
    try {
      const parsed = Linking.parse(url);
      const encoded = parsed.queryParams?.p as string | undefined;
      if (encoded) {
        const sections = decodeProtocol(encoded);
        if (sections) {
          setSections(sections);
        }
      }
    } catch {}
  }

  useEffect(() => {
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink(url);
    });

    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    return () => sub.remove();
  }, []);

  const initialRoute = phase === 'active' ? 'Active' : 'Home';

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Config"
          component={ConfigScreen}
          options={{ title: 'Protocole' }}
        />
        <Stack.Screen
          name="Active"
          component={ActiveScreen}
          options={{ title: 'En cours', headerBackVisible: false }}
        />
        <Stack.Screen
          name="Done"
          component={DoneScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SavedPresets"
          component={SavedPresetsScreen}
          options={{ title: 'Mes protocoles' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
