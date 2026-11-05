import React, { createContext, useContext, useState } from "react";

export type UserRole = "admin" | "basic";

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
  provider: "credentials" | "azure-ad";
  loginTime: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  isNewUser?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isBasic: boolean;
  loginAdmin: (password: string, email?: string) => Promise<AuthResult>;
  loginBasic: (email: string, password: string) => Promise<AuthResult>;
  signupBasic: (name: string, email: string, password: string, department?: string) => Promise<AuthResult>;
  loginWithAzure: () => void;
  setAuthenticatedUser: (user: User) => void;
  logout: () => void;
}

const AUTH_STORAGE_KEY = "cloud_dashboard_session_user";

export const DEFAULT_ADMIN_USER: User = {
  id: "finops-lead",
  name: "FinOps Administrator",
  email: "admin@coforge.com",
  role: "admin",
  department: "Cloud FinOps & Infrastructure",
  provider: "azure-ad",
  loginTime: new Date().toISOString(),
};

function getStoredUser(): User {
  try {
    const local = localStorage.getItem(AUTH_STORAGE_KEY);
    const session = sessionStorage.getItem(AUTH_STORAGE_KEY);
    const stored = local || session;
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object") {
        return {
          ...DEFAULT_ADMIN_USER,
          ...parsed,
          role: "admin", // Ensure admin privileges always without login barrier
        };
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_ADMIN_USER;
}

export const ADMIN_CREDENTIALS = {
  email: "dashboard-admin@coforge.com",
  password: "8iie9gb",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(() => getStoredUser());

  const loginAdmin = async (_password: string, _email: string = ADMIN_CREDENTIALS.email): Promise<AuthResult> => {
    return { success: true, user };
  };

  const loginBasic = async (_email: string, _password: string): Promise<AuthResult> => {
    return { success: true, user };
  };

  const signupBasic = async (
    name: string,
    email: string,
    _password: string,
    department: string = "Digital Engineering"
  ): Promise<AuthResult> => {
    const updated: User = {
      ...user,
      name: name || user.name,
      email: email || user.email,
      department,
    };
    setUser(updated);
    return { success: true, user: updated };
  };

  const loginWithAzure = () => {
    // Direct access - no redirect needed
  };

  const setAuthenticatedUser = (newUser: User) => {
    const adminUser = { ...newUser, role: "admin" as UserRole };
    setUser(adminUser);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
    } catch {}
  };

  const logout = () => {
    // No-op or reset to default admin user so app remains fully open
    setUser(DEFAULT_ADMIN_USER);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: true, // Always authenticated
        isAdmin: true, // Always admin access
        isBasic: false,
        loginAdmin,
        loginBasic,
        signupBasic,
        loginWithAzure,
        setAuthenticatedUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
