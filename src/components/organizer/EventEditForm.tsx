import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEvents } from '../../contexts/EventContext';
import FormField from './FormField';

const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors';

export default function EventEditForm() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { getEvent, updateEvent } = useEvents();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    brand: '',
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    price: '',
    capacity: '',
  });

  useEffect(() => {
    if (!eventId) return;
    const event = getEvent(eventId);
    if (!event) return;
    setForm({
      brand: event.brand,
      title: event.title,
      description: event.description,
      date: event.date,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location,
      price: event.price > 0 ? String(event.price) : '',
      capacity: event.capacity != null ? String(event.capacity) : '',
    });
  }, [eventId, getEvent]);

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.brand.trim()) errs.brand = 'Brand is required';
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.date) errs.date = 'Date is required';
    if (!form.start_time) errs.start_time = 'Start time is required';
    if (!form.end_time) errs.end_time = 'End time is required';
    if (!form.location.trim()) errs.location = 'Location is required';
    if (form.price !== '' && isNaN(Number(form.price))) errs.price = 'Price must be a number';
    if (form.capacity !== '' && isNaN(Number(form.capacity))) errs.capacity = 'Capacity must be a number';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      await updateEvent(eventId, {
        brand: form.brand.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        location: form.location.trim(),
        price: Number(form.price) || 0,
        capacity: form.capacity ? Number(form.capacity) : null,
      });
      navigate(`/admin/events/${eventId}`);
    } catch {
      setErrors({ submit: 'Failed to update event. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!eventId || !getEvent(eventId)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-slate-500">Event not found.</p>
        <button onClick={() => navigate('/admin/events')} className="mt-4 text-brand-600 hover:underline text-sm">
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(`/admin/events/${eventId}`)}
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Event
      </button>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100">
          <h1 className="text-xl font-semibold text-slate-900">Edit Event</h1>
          <p className="text-sm text-slate-500 mt-1">Update event details below.</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Brand" required error={errors.brand}>
              <input type="text" className={inputClass} placeholder="e.g. Acme Corp" value={form.brand} onChange={e => update('brand', e.target.value)} />
            </FormField>
            <FormField label="Title" required error={errors.title}>
              <input type="text" className={inputClass} placeholder="Event title" value={form.title} onChange={e => update('title', e.target.value)} />
            </FormField>
          </div>

          <FormField label="Description" error={errors.description}>
            <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Brief description" value={form.description} onChange={e => update('description', e.target.value)} />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <FormField label="Date" required error={errors.date}>
              <input type="date" className={inputClass} value={form.date} onChange={e => update('date', e.target.value)} />
            </FormField>
            <FormField label="Start Time" required error={errors.start_time}>
              <input type="time" className={inputClass} value={form.start_time} onChange={e => update('start_time', e.target.value)} />
            </FormField>
            <FormField label="End Time" required error={errors.end_time}>
              <input type="time" className={inputClass} value={form.end_time} onChange={e => update('end_time', e.target.value)} />
            </FormField>
          </div>

          <FormField label="Location" required error={errors.location}>
            <input type="text" className={inputClass} placeholder="Venue name and address" value={form.location} onChange={e => update('location', e.target.value)} />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Price (USD)" hint="Leave empty or 0 for free" error={errors.price}>
              <input type="number" min="0" step="0.01" className={inputClass} placeholder="0.00" value={form.price} onChange={e => update('price', e.target.value)} />
            </FormField>
            <FormField label="Capacity" hint="Leave empty for unlimited" error={errors.capacity}>
              <input type="number" min="1" className={inputClass} placeholder="Unlimited" value={form.capacity} onChange={e => update('capacity', e.target.value)} />
            </FormField>
          </div>

          {errors.submit && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{errors.submit}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate(`/admin/events/${eventId}`)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <Save className="w-4 h-4" />
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
