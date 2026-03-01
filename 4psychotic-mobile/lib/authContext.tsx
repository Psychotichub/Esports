import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  requireAuth: (action: string, onAuth?: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = '@4psychotic_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Simulate API call - replace with actual authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data - in production, get from API
      const mockUser: User = {
        id: '1',
        name: email.split('@')[0],
        email: email,
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      // Simulate API call - replace with actual authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data - in production, get from API
      const mockUser: User = {
        id: Date.now().toString(),
        name: name,
        email: email,
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const requireAuth = (action: string, onAuth?: () => void) => {
    if (!user) {
      // This will be handled by the component showing the auth modal
      return false;
    }
    if (onAuth) {
      onAuth();
    }
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
