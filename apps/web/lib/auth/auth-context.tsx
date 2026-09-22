"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import type { LoginInput, LoginResult, RegisterInput, UpdateProfileInput, User } from "@/features/auth/types/auth.types";
import { authApi } from "@/features/auth/api/auth.api";
import { tokenStorage } from "./token-storage";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput, remember?: boolean) => Promise<LoginResult>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state from browser storage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = tokenStorage.getToken();
      const storedUser = tokenStorage.getUser<User>();

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          setUser(storedUser);
        }

        try {
          // Verify & refresh profile with backend
          const me = await authApi.getMe();
          setUser(me);
          tokenStorage.setUser(me);
        } catch (error) {
          console.warn("Session token expired or invalid:", error);
          tokenStorage.clearToken();
          setToken(null);
          setUser(null);
        }
      }

      setIsLoading(false);
    };

    void initAuth();
  }, []);

  const login = useCallback(async (input: LoginInput, remember = true): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const result = await authApi.login(input);
      setToken(result.accessToken);
      setUser(result.user);
      tokenStorage.setToken(result.accessToken, remember);
      tokenStorage.setUser(result.user, remember);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (input: RegisterInput): Promise<User> => {
    setIsLoading(true);
    try {
      return await authApi.register(input);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clearToken();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!tokenStorage.getToken()) return;
    try {
      const me = await authApi.getMe();
      setUser(me);
      tokenStorage.setUser(me);
    } catch (error) {
      console.warn("Failed to refresh user:", error);
    }
  }, []);

  const updateProfile = useCallback(async (input: UpdateProfileInput): Promise<User> => {
    const updated = await authApi.updateProfile(input);
    setUser(updated);
    tokenStorage.setUser(updated);
    return updated;
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      register,
      logout,
      refreshUser,
      updateProfile,
    }),
    [user, token, isLoading, login, register, logout, refreshUser, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
