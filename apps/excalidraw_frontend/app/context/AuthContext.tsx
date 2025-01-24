"use client";
import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the shape of the authentication context
interface AuthContextType {
  isSignin: boolean;
  token: string | null;
  signIn: (token: string) => void;
  signOut: () => void;
  signUp: () => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  isSignin: false,
  token: null,
  signIn: () => {},
  signOut: () => {},
  signUp: () => {},
});

// Create a provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSignin, setIsSignin] = useState<boolean>(!!localStorage.getItem('token'));
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  const signIn = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsSignin(true);
  };

  const signUp = () => {
    setToken(null);
    setIsSignin(true);
  }

  const signOut = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsSignin(false);
  };

  return (
    <AuthContext.Provider value={{ isSignin, token, signIn, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};