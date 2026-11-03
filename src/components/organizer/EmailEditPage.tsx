import { ArrowLeft, RotateCcw, Save, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, KeyboardEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useEvents } from '../../contexts/EventContext';
import type { EventProperties } from '../../types/organizer';
import FormField from './FormField';
import { emailService } from '../../services/emailService';
import { eventService, eventPropertyService } from '../../services/eventService';
import { imageService } from '../../services/imageService';

const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors';

const defaultProps: Omit<EventProperties, 'event_id'> = {
  invitationpre: '',
  invitationpost: '',
  catering: '',
  parking: '',
};

function buildPreview(event: { brand: string; title: string; description: string; location: string; date: string }, props: Omit<EventProperties, 'event_id'>) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;">
      <div style="background:#1d4ed8;color:white;padding:24px;border-radius:8px 8px 0 0;">
        <p style="margin:0;font-size:12px;opacity:0.8;text-transform:uppercase;letter-spacing:1px;">${event.brand}</p>
        <h1 style="margin:8px 0 0;font-size:22px;">${event.title}</h1>
      </div>
      <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
        ${props.invitationpre ? `<p>${props.invitationpre}</p>` : ''}
        <p style="color:#64748b;">${event.description}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;" />
        <p><strong>Location:</strong> ${event.location}</p>
        <p><strong>Date:</strong> ${event.date}</p>
        ${props.invitationpost ? `<p>${props.invitationpost}</p>` : ''}
        <div style="margin-top:24px;text-align:center;">
          <a href="#" style="background:#2563eb;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;">RSVP Now</a>
        </div>
      </div>
    </div>
  `;
}

function FileUploadField({
  label,
  id,
  eventId,
  propertyName,
  imageCode,
  onUploaded,
}: {
  label: string;
  id: string;
  eventId?: number;
  propertyName: string;
  imageCode?: string;
  onUploaded?: (propertyName: string, imageCode: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (file: File | undefined) => {
    setError(null);
    if (!file || !eventId) {
      setFileName(null);
      return;
    }
    setUploading(true);
    try {
      const res = await imageService.upload(file, { folder: 'events', eventId, name: propertyName });
      setFileName(file.name);
      onUploaded?.(propertyName, res.image_code);
    } catch (err: any) {
      setFileName(null);
      setError(String(err?.message ?? err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input
        ref={fileRef}
        id={id}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => void handleChange(e.target.files?.[0])}
      />
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        className="p-4 text-center transition-colors border-2 border-dashed rounded-lg cursor-pointer border-slate-300 hover:border-brand-400 hover:bg-brand-50"
      >
        {uploading ? (
          <p className="text-sm text-slate-500">Uploading…</p>
        ) : imageCode && !fileName ? (
          <img
            src={imageService.buildUrl(imageCode, { w: 200 })}
            alt={label}
            className="mx-auto max-h-20"
          />
        ) : fileName ? (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-700">
            <Upload className="w-4 h-4 text-brand-600" />
            <span className="font-medium">{fileName}</span>
          </div>
        ) : (
          <>
            <Upload className="w-5 h-5 mx-auto mb-1.5 text-slate-400" />
            <p className="text-sm text-slate-500">Click to upload</p>
          </>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const IMAGE_FIELDS = [
  { name: 'top_image_1', label: 'Header Image 1', id: 'header-img-1' },
  { name: 'top_image_2', label: 'Header Image 2', id: 'header-img-2' },
  { name: 'bottom_image_1', label: 'Footer Image 1', id: 'footer-img-1' },
  { name: 'bottom_image_2', label: 'Footer Image 2', id: 'footer-img-2' },
] as const;
const IMAGE_NAMES: string[] = IMAGE_FIELDS.map(f => f.name);

export default function EmailEditPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { getEvent } = useEvents();
  const [images, setImages] = useState<Record<string, string>>({});
  const [props, setProps] = useState<Omit<EventProperties, 'event_id'>>(defaultProps);
  const [saved, setSaved] = useState(false);
  const [remotePreviewHtml, setRemotePreviewHtml] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const confirmTimeout = useRef<number | null>(null);

  const handlePreviewClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as Element | null;
    const anchor = target?.closest ? (target.closest('a') as HTMLAnchorElement | null) : null;
    if (anchor) {
      e.preventDefault();
    }
  };

  const handlePreviewKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as Element | null;
    const anchor = target?.closest ? (target.closest('a') as HTMLAnchorElement | null) : null;
    if (anchor && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
    }
  };

  const event = eventId ? getEvent(eventId) : undefined;

  useEffect(() => {
    return () => {
      if (confirmTimeout.current) {
        window.clearTimeout(confirmTimeout.current);
        confirmTimeout.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!eventId) return;
    let mounted = true;
    (async () => {
      try {
        const res = await eventService.getById(Number(eventId));
        const apiEvent = (res && (res as any).event) as any;
        const propsFromApi: any = {};
        if (apiEvent && Array.isArray(apiEvent.properties)) {
          const loadedImages: Record<string, string> = {};
          apiEvent.properties.forEach((p: any) => {
            if (p && IMAGE_NAMES.includes(p.name)) loadedImages[p.name] = p.value ?? '';
          });
          if (mounted) setImages(loadedImages);
          apiEvent.properties.forEach((p: any) => {
            if (!p || !p.name || IMAGE_NAMES.includes(p.name)) return;
            if (p.name === 'invitationpre') propsFromApi.invitationpre = p.value ?? '';
            else if (p.name === 'invitationpost') propsFromApi.invitationpost = p.value ?? '';
            else propsFromApi[p.name] = p.value ?? '';
          });
        }
        if (apiEvent) {
          if (apiEvent.date) propsFromApi.date = apiEvent.date;
          if (apiEvent.startTime) propsFromApi.start_time = apiEvent.startTime;
          if (apiEvent.endTime) propsFromApi.end_time = apiEvent.endTime;
        }

        if (mounted && Object.keys(propsFromApi).length) {
          setProps(prev => ({ ...prev, ...propsFromApi } as any));
          localStorage.setItem(`event_props_${eventId}`, JSON.stringify({ ...(props as any), ...propsFromApi }));
          return;
        }
      } catch {
        // ignore backend failures
      }

      const stored = localStorage.getItem(`event_props_${eventId}`);
      if (stored) {
        try { if (mounted) setProps(JSON.parse(stored)); } catch { /* ignore */ }
      }
    })();
    return () => { mounted = false; };
  }, [eventId]);

  const refreshPreview = async () => {
    if (!eventId) return;
    setRemotePreviewHtml(null);
    setPreviewError(null);
    setLoadingPreview(true);
    try {
      const html = await emailService.getEmailPreview(Number(eventId));
      setRemotePreviewHtml(html);
    } catch (err: any) {
      setPreviewError(String(err?.message ?? err));
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (!eventId) return;
    setRemotePreviewHtml(null);
    setPreviewError(null);
    setLoadingPreview(true);
    emailService
      .getEmailPreview(Number(eventId))
      .then(html => setRemotePreviewHtml(html))
      .catch(err => setPreviewError(String(err?.message ?? err)))
      .finally(() => setLoadingPreview(false));
  }, [eventId]);

  const update = (field: keyof typeof defaultProps, value: string) => {
    setProps(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!eventId) return;
    try {
      const existingRes = await eventService.getById(Number(eventId));
      const apiEvent = (existingRes && (existingRes as any).event) as any;
      const existingProps = Array.isArray(apiEvent?.properties) ? apiEvent.properties : [];

      const augmented = {
        ...(props as Record<string, string>),
        date: event?.date ?? '',
        start_time: event?.start_time ?? '',
        end_time: event?.end_time ?? '',
      };
      const entries = Object.entries(augmented) as [string, string][];
      await Promise.all(
        entries.map(async ([name, value]) => {
          const propName = name === 'invitationpre' ? 'invitationpre' : name === 'invitationpost' ? 'invitationpost' : name;
          const found = existingProps.find((p: any) => p.name === propName);
          if (found) {
            await eventPropertyService.update(found.id, { value });
          } else {
            await eventPropertyService.create({ eventId: Number(eventId), name: propName, value });
          }
        })
      );

      localStorage.setItem(`event_props_${eventId}`, JSON.stringify(props));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      void refreshPreview();
    } catch (err) {
      console.error('Failed to save event properties', err);
      localStorage.setItem(`event_props_${eventId}`, JSON.stringify(props));
    }
  };

  const handleImageUploaded = (name: string, code: string) => {
    setImages(prev => ({ ...prev, [name]: code }));
    void refreshPreview();
  };

  const renderImageField = (f: (typeof IMAGE_FIELDS)[number]) => (
    <FileUploadField
      key={f.name}
      label={f.label}
      id={f.id}
      eventId={eventId ? Number(eventId) : undefined}
      propertyName={f.name}
      imageCode={images[f.name]}
      onUploaded={handleImageUploaded}
    />
  );

  const handleClear = () => {
    if (!eventId) return;
    localStorage.removeItem(`event_props_${eventId}`);
    setProps(defaultProps);
  };

  if (!event) {
    return (
      <div className="max-w-4xl px-4 py-8 mx-auto text-center">
        <p className="text-slate-500">Event not found.</p>
        <button onClick={() => window.history.back()} className="mt-4 text-sm text-brand-600 hover:underline">
          Back to Events
        </button>
      </div>
    );
  }
  const previewHtml = buildPreview(event, props);
  return (
    <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 mb-6 text-sm transition-colors text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Event
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Email Template</h1>
          <p className="mt-1 text-sm text-slate-500">{event.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!confirmingReset) {
                setConfirmingReset(true);
                if (confirmTimeout.current) window.clearTimeout(confirmTimeout.current);
                confirmTimeout.current = window.setTimeout(() => setConfirmingReset(false), 5000) as unknown as number;
                return;
              }
              handleClear();
              setConfirmingReset(false);
              if (confirmTimeout.current) {
                window.clearTimeout(confirmTimeout.current);
                confirmTimeout.current = null;
              }
            }}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors border rounded-lg ${
              confirmingReset
                ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            {confirmingReset ? 'Confirm Reset' : 'Reset'}
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              saved ? 'bg-emerald-600' : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            <Save className="w-4 h-4" />
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="p-6 space-y-5 bg-white border shadow-sm rounded-xl border-slate-200">
          {/* Top file uploads */}
          <div className="grid grid-cols-2 gap-4">
            {IMAGE_FIELDS.slice(0, 2).map(f => renderImageField(f))}
          </div>

          <FormField label="Pre-Text" hint="Opening paragraph before event details">
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="You're invited to an exclusive event..."
              value={props.invitationpre}
              onChange={e => update('invitationpre', e.target.value)}
            />
          </FormField>
          <FormField label="Post-Text" hint="Closing paragraph after event details">
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="We look forward to seeing you there..."
              value={props.invitationpost}
              onChange={e => update('invitationpost', e.target.value)}
            />
          </FormField>

          {/* Bottom file uploads */}
          <div className="grid grid-cols-2 gap-4">
            {IMAGE_FIELDS.slice(2).map(f => renderImageField(f))}
          </div>
        </div>

        <div className="overflow-hidden bg-white border shadow-sm rounded-xl border-slate-200">
          <div className="p-4 overflow-y-auto max-h-[600px]">
            {loadingPreview ? (
              <p className="text-sm text-slate-500">Loading preview…</p>
            ) : previewError ? (
              <div className="text-sm text-red-600">Failed to load preview: {previewError}</div>
            ) : (
              <div
                onClick={handlePreviewClick}
                onKeyDown={handlePreviewKeyDown}
                dangerouslySetInnerHTML={{ __html: remotePreviewHtml ?? previewHtml }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
