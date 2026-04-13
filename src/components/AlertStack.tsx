import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { useAlert } from '../contexts/AlertContext';

const icons = {
  error: AlertCircle,
  success: CheckCircle,
  info: Info,
};

const styles = {
  error: 'bg-red-50 border-red-200 text-red-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export default function AlertStack() {
  const { alerts, dismissAlert } = useAlert();

  if (!alerts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {alerts.map(alert => {
        const Icon = icons[alert.type];
        return (
          <div
            key={alert.id}
            className={`flex items-start gap-3 border rounded-lg px-4 py-3 shadow-lg transition-all animate-in slide-in-from-right ${styles[alert.type]}`}
          >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="flex-1 text-sm font-medium">{alert.message}</p>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
