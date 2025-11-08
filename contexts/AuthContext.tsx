
import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { User } from '../types';
import { storageService } from '../services/storageService';

interface AuthContextType {
  user: User | null;
  login: (credentials: Omit<User, 'id' | 'role'>) => Promise<User | null>;
  register: (credentials: Omit<User, 'id'>) => Promise<User | null>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = storageService.get<User>('currentUser');
      if (storedUser) {
        setUser(storedUser);
      }
    } catch (error) {
        console.error("Failed to load user from storage", error);
    } finally {
        setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials: Omit<User, 'id' | 'role'>): Promise<User | null> => {
    const users = storageService.get<User[]>('users') || [];
    const foundUser = users.find(u => u.username === credentials.username && u.password === credentials.password);
    
    if (foundUser) {
      const userToStore = { id: foundUser.id, username: foundUser.username, role: foundUser.role };
      setUser(userToStore);
      storageService.set('currentUser', userToStore);
      return userToStore;
    }
    return null;
  }, []);

  const register = useCallback(async (credentials: Omit<User, 'id'>): Promise<User | null> => {
    const users = storageService.get<User[]>('users') || [];
    const userExists = users.some(u => u.username === credentials.username);

    if (userExists) {
        return null;
    }

    const newUser: User = {
        id: `user-${Date.now()}`,
        ...credentials,
    };

    users.push(newUser);
    storageService.set('users', users);
    
    const userToStore = { id: newUser.id, username: newUser.username, role: newUser.role };
    setUser(userToStore);
    storageService.set('currentUser', userToStore);
    return userToStore;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    storageService.remove('currentUser');
  }, []);

  const value = useMemo(() => ({ user, login, register, logout, loading }), [user, login, register, logout, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
