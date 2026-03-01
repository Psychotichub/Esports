import React, { useEffect } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Home, Video, User, Settings, Users } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { TRPCProvider } from '../lib/TRPCProvider';
import { AuthProvider } from '../lib/authContext';
import { trpc } from '../lib/trpc';

// Import screens
import HomeScreen from './screens/HomeScreen';
import VideosScreen from './screens/VideosScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import PeopleScreen from './screens/PeopleScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const NEON_RED = '#ff1744';
const DARK_BG = '#0a0e1a';

/** Badge showing number of active live streams on the Videos tab */
function LiveBadge() {
  const { data: liveStreams } = trpc.youtube.liveStreams.useQuery(undefined, {
    refetchInterval: 60000, // check every 60s
    staleTime: 30000,
  });
  const count = liveStreams?.filter(s => s.isLive).length ?? 0;
  if (count === 0) return null;
  return (
    <View style={badgeStyles.badge}>
      <Text style={badgeStyles.text}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: NEON_RED,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: DARK_BG,
  },
  text: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 11,
  },
});

function TabNavigator() {
  return (
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
          title: 'Live',
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <Video size={size} color={color} strokeWidth={2} />
              <LiveBadge />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="people"
        component={PeopleScreen}
        options={{
          title: 'Community',
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} strokeWidth={2} />
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
          title: 'Hub',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function RootLayoutContent() {
  return (
    <>
      <NavigationIndependentTree>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: DARK_BG },
            }}
          >
            <Stack.Screen name="main" component={TabNavigator} />
            <Stack.Screen name="login" component={LoginScreen} />
            <Stack.Screen name="signup" component={SignupScreen} />
          </Stack.Navigator>
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
          <AuthProvider>
            <RootLayoutContent />
          </AuthProvider>
        </TRPCProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
