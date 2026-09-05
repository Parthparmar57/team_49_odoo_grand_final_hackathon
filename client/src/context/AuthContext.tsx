import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../api/client';
import {
  User,
  UserRole,
  LoginCredentials,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  AdminCreateUserPayload,
} from '../types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  forgotPassword: (payload: ForgotPasswordPayload) => Promise<{ success: boolean; message?: string; error?: string; resetToken?: string }>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<{ success: boolean; message?: string; error?: string }>;
  adminCreateUser: (payload: AdminCreateUserPayload) => Promise<{ success: boolean; user?: User; tempPassword?: string; error?: string }>;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(apiClient.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Hydrate user on mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = apiClient.getToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.getMe();
        if (response.success && response.data) {
          setUser(response.data);
          setToken(storedToken);
        } else {
          // Token invalid or expired
          apiClient.removeToken();
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Auth hydration error:', err);
        apiClient.removeToken();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await apiClient.login(credentials);
      if (response.success && response.data) {
        const loggedUser = response.data.user;
        const jwtToken = response.data.token;
        setUser(loggedUser);
        setToken(jwtToken);
        setIsLoading(false);
        return { success: true, user: loggedUser };
      } else {
        setIsLoading(false);
        return {
          success: false,
          error: response.error?.message || 'Invalid email or password',
        };
      }
    } catch (err: any) {
      setIsLoading(false);
      return {
        success: false,
        error: err?.message || 'Login request failed',
      };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiClient.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setToken(null);
      setIsLoading(false);
    }
  };

  const forgotPassword = async (payload: ForgotPasswordPayload) => {
    try {
      const response = await apiClient.forgotPassword(payload);
      if (response.success && response.data) {
        return {
          success: true,
          message: response.data.message,
          resetToken: response.data.resetToken,
        };
      } else {
        return {
          success: false,
          error: response.error?.message || 'Failed to send reset link',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Request failed',
      };
    }
  };

  const resetPassword = async (payload: ResetPasswordPayload) => {
    try {
      const response = await apiClient.resetPassword(payload);
      if (response.success && response.data) {
        return {
          success: true,
          message: response.data.message,
        };
      } else {
        return {
          success: false,
          error: response.error?.message || 'Failed to reset password',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Request failed',
      };
    }
  };

  const adminCreateUser = async (payload: AdminCreateUserPayload) => {
    try {
      const response = await apiClient.adminCreateUser(payload);
      if (response.success && response.data) {
        return {
          success: true,
          user: response.data.user,
          tempPassword: response.data.tempPassword,
        };
      } else {
        return {
          success: false,
          error: response.error?.message || 'Failed to create user',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Request failed',
      };
    }
  };

  const hasRole = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        forgotPassword,
        resetPassword,
        adminCreateUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
