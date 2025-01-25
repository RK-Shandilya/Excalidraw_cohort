"use client";
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";

// Define the authentication context
interface AuthContextType {
  isSignin: boolean;
  token: string | null;
  signIn: (token: string) => void;
  signOut: () => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  isSignin: false,
  token: null,
  signIn: () => {},
  signOut: () => {},
});

// Create a provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSignin, setIsSignin] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);

  // Access localStorage inside useEffect to avoid SSR issues
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      setIsSignin(true);
    }
  }, []);

  const signIn = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setIsSignin(true);
  };

  const signOut = () => {
    localStorage.removeItem("token");
    setToken(null);
    setIsSignin(false);
  };

  return (
    <AuthContext.Provider value={{ isSignin, token, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
