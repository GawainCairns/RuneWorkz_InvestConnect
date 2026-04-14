import React, { useCallback, useState } from 'react';
import { createCtx } from './createCtx';

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

const [AlertContext, useAlertContext] = createCtx<AlertContextValue>();

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

export const useAlert = useAlertContext;
