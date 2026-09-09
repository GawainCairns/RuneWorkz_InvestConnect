import { X } from 'lucide-react';
import { useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';

interface EmailPreviewModalProps {
  subject: string;
  toEmail: string;
  sentAt: string;
  body: string;
  onClose: () => void;
}

export default function EmailPreviewModal({ subject, toEmail, sentAt, body, onClose }: EmailPreviewModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    // legacy: writing into the iframe document is replaced by `srcDoc`
  }, [onClose]);

  const srcDoc = useMemo(() => {
    // strip script tags to avoid executing embedded scripts in email HTML
    const stripped = body.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;padding:16px;margin:0;font-size:14px;line-height:1.6;color:#1e293b;}</style></head><body>${stripped}</body></html>`;
  }, [body]);

  const { isJson, parsed } = useMemo(() => {
    try {
      const parsed = JSON.parse(body);
      return { isJson: true, parsed } as const;
    } catch (err) {
      return { isJson: false, parsed: null } as const;
    }
  }, [body]);

  function renderJson(value: any, path = ''): JSX.Element {
    if (value === null || value === undefined) return <span className="text-slate-600">{String(value)}</span>;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return <span className="text-slate-700">{String(value)}</span>;
    }
    if (Array.isArray(value)) {
      return (
        <ol className="pl-5 list-decimal">
          {value.map((v, i) => (
            <li key={i} className="mb-1">
              {renderJson(v, `${path}[${i}]`)}
            </li>
          ))}
        </ol>
      );
    }
    // object
    return (
      <div className="space-y-2">
        {Object.keys(value).map((k) => (
          <div key={k} className="flex items-start gap-3">
            <div className="text-xs text-slate-500 w-36 shrink-0">{k}</div>
            <div className="flex-1">{renderJson(value[k], path ? `${path}.${k}` : k)}</div>
          </div>
        ))}
      </div>
    );
  }

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[90vw] max-h-[96vh] flex flex-col z-10">
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="min-w-0">
            <h3 className="font-semibold truncate text-slate-900">{subject}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              To: {toEmail} &middot; {new Date(sentAt).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 p-4 overflow-auto">
          {isJson && parsed ? (
            <div className="max-h-[70vh] overflow-auto">
              {renderJson(parsed)}
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              title="Email Preview"
              srcDoc={srcDoc}
              sandbox=""
              className="w-full h-full min-h-[60vh]"
            />
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') return createPortal(modal, document.body);
  return modal;
}
