import React from 'react';
import { View } from 'react-native';

// This index route is required by Expo Router
// The actual navigation is handled by React Navigation tabs in _layout.tsx
// This component will never be shown because _layout.tsx renders the tab navigator
export default function Index() {
  return <View style={{ flex: 1 }} />;
}
