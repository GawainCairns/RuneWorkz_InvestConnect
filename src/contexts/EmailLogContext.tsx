import React, { createContext, useCallback, useContext, useState } from 'react';
import type { EmailLog } from '../types/organizer';

interface EmailLogContextValue {
  emailLogs: EmailLog[];
  loading: boolean;
  error: string | null;
  fetchEmailLogs: (eventId?: string) => Promise<void>;
  logEmail: (data: Omit<EmailLog, 'id' | 'sent_at'>) => Promise<EmailLog>;
}

const EmailLogContext = createContext<EmailLogContextValue | null>(null);

export function EmailLogProvider({ children }: { children: React.ReactNode }) {
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmailLogs = useCallback(async (_eventId?: string) => {
    setLoading(true);
    setError(null);
    try {
      setEmailLogs([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch email logs');
    } finally {
      setLoading(false);
    }
  }, []);

  const logEmail = useCallback(async (data: Omit<EmailLog, 'id' | 'sent_at'>): Promise<EmailLog> => {
    const newLog: EmailLog = {
      ...data,
      id: crypto.randomUUID(),
      sent_at: new Date().toISOString(),
    };
    setEmailLogs(prev => [...prev, newLog]);
    return newLog;
  }, []);

  return (
    <EmailLogContext.Provider value={{ emailLogs, loading, error, fetchEmailLogs, logEmail }}>
      {children}
    </EmailLogContext.Provider>
  );
}

export function useEmailLogs() {
  const ctx = useContext(EmailLogContext);
  if (!ctx) throw new Error('useEmailLogs must be used within EmailLogProvider');
  return ctx;
}
