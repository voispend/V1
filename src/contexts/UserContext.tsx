import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface UserContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  updateUserProfile: (updates: { name?: string; avatar?: string }) => Promise<void>;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

const STORAGE_KEY = 'user:profile';

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authUser) {
      loadUserProfile();
    } else {
      setUser(null);
    }
  }, [authUser]);

  const loadUserProfile = async () => {
    if (!authUser) return;
    try {
      setLoading(true);
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const storedUser = JSON.parse(raw) as UserProfile;
        // Always sync with current auth user data
        const syncedUser: UserProfile = {
          ...storedUser,
          id: authUser.id,
          email: authUser.email, // Always use current auth email
          name: storedUser.name || authUser.name || authUser.email?.split('@')[0] || 'User',
        };
        setUser(syncedUser);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(syncedUser));
        return;
      }
      // Seed from auth stub
      const seeded: UserProfile = {
        id: authUser.id,
        name: authUser.name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email,
        avatar: undefined,
      };
      setUser(seeded);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: { name?: string; avatar?: string }) => {
    if (!user) return;
    setLoading(true);
    try {
      const next: UserProfile = {
        ...user,
        name: updates.name ?? user.name,
        avatar: updates.avatar ?? user.avatar,
      };
      setUser(next);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, updateUserProfile, loading }}>
      {children}
    </UserContext.Provider>
  );
};