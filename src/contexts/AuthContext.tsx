import React, { useCallback, useEffect, useState } from 'react';
import { createCtx } from './createCtx';
import { AUTH_API_BASE, TENANT_ID, TOKEN_STORAGE_KEY } from '../config/constants';

interface UserProfile {
  id: number;
  email: string;
  active: number;
  avatar: string | null;
  lastname: string;
  username: string;
  firstname: string;
  tenant_id: string;
  date_created: string;
}

interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions: { id: number; name: string; value: number }[];
}

interface UserProperty {
  id: number;
  name: string;
  value: string;
}

interface UserPermission {
  id: number;
  name: string;
  value: number;
}

export interface AuthProfile {
  user: UserProfile;
  roles: Role[];
  properties: UserProperty[];
  user_permissions: UserPermission[];
}

interface AuthContextValue {
  token: string | null;
  profile: AuthProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  applyAuth: (token: string, profile: AuthProfile) => void;
}

interface RegisterData {
  email: string;
  password: string;
  username: string;
  firstname: string;
  lastname: string;
  avatar: null;
  active: number;
}

const [AuthContext, useAuthContext] = createCtx<AuthContextValue>();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const applyAuth = useCallback((tok: string, prof: AuthProfile) => {
    setToken(tok);
    setProfile(prof);
    localStorage.setItem(TOKEN_STORAGE_KEY, tok);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setProfile(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    const validate = async () => {
      try {
        const res = await fetch(`${AUTH_API_BASE}/validate`, {
          headers: {
            'X-Tenant-ID': TENANT_ID,
            Authorization: `Bearer ${stored}`,
          },
        });
        if (!res.ok) throw new Error('invalid');
        const data = await res.json();
        applyAuth(data.token, data.profile);
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    };
    validate();
  }, [applyAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${AUTH_API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': TENANT_ID,
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Login failed');
    }
    applyAuth(data.token, data.profile);
  }, [applyAuth]);

  const register = useCallback(async (regData: RegisterData) => {
    const res = await fetch(`${AUTH_API_BASE}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': TENANT_ID,
      },
      body: JSON.stringify(regData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Registration failed');
    }
    applyAuth(data.token, data.profile);
  }, [applyAuth]);

  return (
    <AuthContext.Provider value={{ token, profile, loading, login, register, logout, applyAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = useAuthContext;
