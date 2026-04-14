import React, { useEffect, useState } from 'react';
import { createCtx } from './createCtx';
import { AUTH_API_BASE, TENANT_ID } from '../config/constants';

interface TenantProperty {
  name: string;
  value: string;
}

interface TenantData {
  id: number;
  name: string;
  uuid: string;
  owner: string;
  description: string | null;
  date_created: string;
}

interface TenantContextValue {
  tenant: TenantData | null;
  settings: Record<string, string>;
  properties: TenantProperty[];
  loading: boolean;
  error: string | null;
}

const [TenantContext, useTenantContext] = createCtx<TenantContextValue>();

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [properties, setProperties] = useState<TenantProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const res = await fetch(`${AUTH_API_BASE}/tenant/`, {
          headers: { 'X-Tenant-ID': TENANT_ID },
        });
        if (!res.ok) throw new Error('Failed to load tenant');
        const data = await res.json();
        setTenant(data.tenant);
        setSettings(data.settings || {});
        setProperties(data.properties || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Tenant load failed');
      } finally {
        setLoading(false);
      }
    };
    fetchTenant();
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, settings, properties, loading, error }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = useTenantContext;
