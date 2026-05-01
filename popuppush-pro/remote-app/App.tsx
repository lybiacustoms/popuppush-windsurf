/**
 * Pop-up Push Remote App
 * The Smart Remote that Replaces Traditional Remotes Forever
 * 
 * Features:
 * - Thumbnail-based UI for content selection
 * - Layer control dashboard (4-layer system)
 * - Match Mode for instant sports switching
 * - Real-time WebSocket control
 * - Quick match scheduling
 * - Manual Azan button
 */

import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';

// Contexts
import { SocketProvider } from './src/contexts/SocketContext';
import { StoreProvider } from './src/contexts/StoreContext';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import LayersScreen from './src/screens/LayersScreen';
import ContentScreen from './src/screens/ContentScreen';
import MatchesScreen from './src/screens/MatchesScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// Theme colors
export const COLORS = {
  primary: '#F97316',
  primaryDark: '#EA580C',
  background: '#0F172A',
  surface: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  layer1: '#8B5CF6', // Media - Purple
  layer2: '#EC4899', // HDMI - Pink
  layer3: '#F97316', // Pop-up - Orange
  layer4: '#10B981', // Ticker - Green
};

function App(): React.JSX.Element {
  return (
    <StoreProvider>
      <SocketProvider>
        <NavigationContainer>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName: string;
                
                switch (route.name) {
                  case 'Home':
                    iconName = focused ? 'home' : 'home-outline';
                    break;
                  case 'Layers':
                    iconName = focused ? 'layers' : 'layers-outline';
                    break;
                  case 'Content':
                    iconName = focused ? 'play-circle' : 'play-circle-outline';
                    break;
                  case 'Matches':
                    iconName = focused ? 'trophy' : 'trophy-outline';
                    break;
                  case 'Settings':
                    iconName = focused ? 'cog' : 'cog-outline';
                    break;
                  default:
                    iconName = 'help';
                }
                
                return <Icon name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: COLORS.primary,
              tabBarInactiveTintColor: COLORS.textSecondary,
              tabBarStyle: {
                backgroundColor: COLORS.surface,
                borderTopColor: COLORS.background,
                height: 70,
                paddingBottom: 10,
              },
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '600',
              },
              headerStyle: {
                backgroundColor: COLORS.background,
                elevation: 0,
                shadowOpacity: 0,
              },
              headerTintColor: COLORS.text,
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 20,
              },
            })}>
            <Tab.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ title: 'الرئيسية' }}
            />
            <Tab.Screen 
              name="Layers" 
              component={LayersScreen}
              options={{ title: 'الطبقات' }}
            />
            <Tab.Screen 
              name="Content" 
              component={ContentScreen}
              options={{ title: 'المحتوى' }}
            />
            <Tab.Screen 
              name="Matches" 
              component={MatchesScreen}
              options={{ title: 'المباريات' }}
            />
            <Tab.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ title: 'الإعدادات' }}
            />
          </Tab.Navigator>
        </NavigationContainer>
        <Toast />
      </SocketProvider>
    </StoreProvider>
  );
}

export default App;
