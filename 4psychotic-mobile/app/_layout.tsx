import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Home, Video, User, Settings } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { TRPCProvider } from '../lib/TRPCProvider';

// Import screens
import HomeScreen from './screens/HomeScreen';
import VideosScreen from './screens/VideosScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const NEON_RED = '#ff1744';
const DARK_BG = '#0a0e1a';

function RootLayoutContent() {
  return (
    <>
      <NavigationIndependentTree>
        <NavigationContainer>
          <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: NEON_RED,
            tabBarInactiveTintColor: '#ffffff40',
            tabBarStyle: {
              backgroundColor: DARK_BG,
              borderTopColor: '#ffffff08',
              borderTopWidth: 1,
              paddingBottom: 8,
              paddingTop: 8,
              height: 60,
              width: '100%',
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
              marginTop: 4,
            },
          })}
        >
          <Tab.Screen
            name="home"
            component={HomeScreen}
            options={{
              title: 'Home',
              tabBarIcon: ({ color, size }) => (
                <Home size={size} color={color} strokeWidth={2} />
              ),
            }}
          />
          <Tab.Screen
            name="videos"
            component={VideosScreen}
            options={{
              title: 'Videos',
              tabBarIcon: ({ color, size }) => (
                <Video size={size} color={color} strokeWidth={2} />
              ),
            }}
          />
          <Tab.Screen
            name="profile"
            component={ProfileScreen}
            options={{
              title: 'Profile',
              tabBarIcon: ({ color, size }) => (
                <User size={size} color={color} strokeWidth={2} />
              ),
            }}
          />
          <Tab.Screen
            name="settings"
            component={SettingsScreen}
            options={{
              title: 'Settings',
              tabBarIcon: ({ color, size }) => (
                <Settings size={size} color={color} strokeWidth={2} />
              ),
            }}
          />
        </Tab.Navigator>
        </NavigationContainer>
      </NavigationIndependentTree>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  // Add global web styles for responsive design
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Inject global styles for full width and responsiveness
      const style = document.createElement('style');
      style.textContent = `
        * {
          box-sizing: border-box;
        }
        html, body {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        #root, [data-reactroot] {
          width: 100%;
          min-height: 100vh;
        }
        /* Responsive breakpoints */
        @media (max-width: 768px) {
          /* Mobile styles */
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          /* Tablet styles */
        }
        @media (min-width: 1025px) {
          /* Desktop styles - ensure content doesn't exceed viewport */
          body {
            max-width: 100vw;
          }
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, width: '100%', minHeight: '100%' }}>
      <SafeAreaProvider>
        <TRPCProvider>
          <RootLayoutContent />
        </TRPCProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
