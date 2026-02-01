/**
 * Authentication Hook & Context
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, authHash: string) => Promise<void>;
  register: (email: string, authHash: string, salt: string, encryptedMasterKey: string) => Promise<void>;
  logout: () => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved auth on mount
  useEffect(() => {
    async function loadAuth() {
      try {
        const savedToken = await window.electronAPI?.getSecureValue('auth_token');
        const savedUser = localStorage.getItem('user');
        
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          api.setToken(savedToken);
        }
      } catch (error) {
        console.error('Failed to load auth:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadAuth();
  }, []);

  const login = async (email: string, authHash: string) => {
    const response = await api.post('/auth/login', { email, auth_hash: authHash });
    const { access_token, user_id } = response.data;
    
    setToken(access_token);
    setUser({ id: user_id, email });
    
    api.setToken(access_token);
    await window.electronAPI?.setSecureValue('auth_token', access_token);
    localStorage.setItem('user', JSON.stringify({ id: user_id, email }));
  };

  const register = async (
    email: string,
    authHash: string,
    salt: string,
    encryptedMasterKey: string
  ) => {
    const response = await api.post('/auth/register', {
      email,
      auth_hash: authHash,
      salt,
      encrypted_master_key: encryptedMasterKey,
    });
    
    // Auto-login after registration
    await login(email, authHash);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
    }
    
    setUser(null);
    setToken(null);
    api.setToken(null);
    
    await window.electronAPI?.deleteSecureValue('auth_token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
