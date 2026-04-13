import React, { createContext, useCallback, useContext, useState } from 'react';

type AlertType = 'error' | 'success' | 'info';

interface Alert {
  id: string;
  type: AlertType;
  message: string;
}

interface AlertContextValue {
  alerts: Alert[];
  showAlert: (message: string, type?: AlertType) => void;
  dismissAlert: (id: string) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const showAlert = useCallback((message: string, type: AlertType = 'error') => {
    const id = crypto.randomUUID();
    setAlerts(prev => [...prev, { id, type, message }]);
    setTimeout(() => dismissAlert(id), 3000);
  }, [dismissAlert]);

  return (
    <AlertContext.Provider value={{ alerts, showAlert, dismissAlert }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used within AlertProvider');
  return ctx;
}
