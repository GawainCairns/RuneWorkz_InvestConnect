import { ArrowLeft, Save, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEvents } from '../../contexts/EventContext';
import { eventService } from '../../services/eventService';
import FormField from './FormField';

const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors';

export default function EventEditForm() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { getEvent, updateEvent, brands, fetchBrands, createBrand } = useEvents();
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
    // load brands first
    fetchBrands().catch(() => {});
  }, [fetchBrands]);

  useEffect(() => {
    if (!eventId) return;
    const event = getEvent(eventId);
    if (!event) return;
    // If brands map contains the event brand name, prefer the id key
    const foundId = Object.entries(brands).find(([, name]) => name === event.brand)?.[0];
    setForm({
      brand: foundId ?? event.brand,
      title: event.title,
      description: event.description,
      date: event.date,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location,
      price: event.price > 0 ? String(event.price) : '',
      capacity: event.capacity != null ? String(event.capacity) : '',
    });
  }, [eventId, getEvent, brands]);

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

  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandDescription, setNewBrandDescription] = useState('');

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return setErrors(prev => ({ ...prev, brand: 'Brand name is required' }));
    try {
      const created = await createBrand({ name: newBrandName.trim(), description: newBrandDescription.trim() });
      if (created && (created as any).id) {
        setForm(prev => ({ ...prev, brand: String((created as any).id) }));
      }
      setNewBrandName('');
      setNewBrandDescription('');
      setShowAddBrand(false);
    } catch (err) {
      setErrors(prev => ({ ...prev, brand: 'Failed to create brand' }));
    }
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
      // Build partial payload with only changed fields
      const orig = getEvent(eventId);
      if (!orig) throw new Error('Original event not found');

      const payload: any = {};

      // Brand: resolve to numeric brandId if changed
      if ((form.brand ?? '').trim() !== (orig.brand ?? '').trim()) {
        let brandId: number | null = null;
        if (/^\d+$/.test(String(form.brand))) {
          brandId = Number(form.brand);
        } else {
          const found = Object.entries(brands).find(([, name]) => name === form.brand);
          if (found) brandId = Number(found[0]);
        }
        // If still no brandId, create it
        if (!brandId) {
          try {
            const created = await createBrand({ name: String(form.brand), description: '' });
            brandId = (created && (created as any).id) ? (created as any).id : (created && (created as any).brand && (created as any).brand.id) || null;
            // refresh brands map
            await fetchBrands();
          } catch (err) {
            // ignore and allow server to handle invalid brand
          }
        }
        if (brandId != null) payload.brandId = brandId;
      }

      if (form.title.trim() !== (orig.title ?? '')) payload.title = form.title.trim();
      if ((form.description ?? '').trim() !== (orig.description ?? '')) payload.description = form.description.trim() || undefined;
      if (form.date !== orig.date) payload.date = form.date;
      if (form.start_time !== orig.start_time) payload.startTime = form.start_time || undefined;
      if (form.end_time !== orig.end_time) payload.endTime = form.end_time || undefined;
      if (form.location.trim() !== (orig.location ?? '')) payload.location = form.location.trim();

      const priceNum = form.price === '' ? 0 : Number(form.price);
      if ((orig.price ?? 0) !== (isNaN(priceNum) ? 0 : priceNum)) payload.price = isNaN(priceNum) ? 0 : priceNum;

      const capNum = form.capacity === '' ? null : Number(form.capacity);
      const origCap = orig.capacity == null ? null : Number(orig.capacity);
      if (capNum !== origCap) payload.capacity = capNum == null ? 0 : capNum;

      // Only call API if something changed
      if (Object.keys(payload).length > 0) {
        const res = await eventService.update(Number(eventId), payload);
        const apiEvent = (res && (res as any).event) || null;
        if (apiEvent) {
          // Map API event to local Event shape and update context
          const mapped = {
            id: String(apiEvent.id),
            brand: (brands[String(apiEvent.brandId)] ?? String(apiEvent.brandId)),
            title: apiEvent.title || '',
            description: apiEvent.description || '',
            date: apiEvent.date || '',
            start_time: apiEvent.startTime || '',
            end_time: apiEvent.endTime || '',
            location: apiEvent.location || '',
            price: apiEvent.price || 0,
            capacity: apiEvent.capacity ?? null,
            tenant_id: '',
            created_at: apiEvent.createdAt || '',
            updated_at: apiEvent.updatedAt || '',
          };
          await updateEvent(eventId, mapped as any);
        }
      }
      navigate(`/admin/events/${eventId}`);
    } catch {
      setErrors({ submit: 'Failed to update event. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!eventId || !getEvent(eventId)) {
    return (
      <div className="max-w-2xl px-4 py-8 mx-auto text-center">
        <p className="text-slate-500">Event not found.</p>
        <button onClick={() => navigate('/admin/events')} className="mt-4 text-sm text-brand-600 hover:underline">
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl px-4 py-8 mx-auto sm:px-6 lg:px-8">
      <button
        onClick={() => navigate(`/admin/events/${eventId}`)}
        className="flex items-center gap-2 mb-6 text-sm transition-colors text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Event
      </button>

      <div className="bg-white border shadow-sm rounded-xl border-slate-200">
        <div className="px-6 py-5 border-b border-slate-100">
          <h1 className="text-xl font-semibold text-slate-900">Edit Event</h1>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="Brand" required error={errors.brand}>
              <div className="flex items-start gap-3">
                <select
                  className={`${inputClass} max-w-full`}
                  value={form.brand}
                  onChange={e => update('brand', e.target.value)}
                >
                  <option value="">Select a brand</option>
                  {brands && Object.entries(brands).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddBrand(prev => !prev)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors bg-white border rounded-lg text-brand-600 border-slate-300 hover:bg-slate-50"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              {showAddBrand && (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Brand name"
                    value={newBrandName}
                    onChange={e => setNewBrandName(e.target.value)}
                  />
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Short description (optional)"
                    value={newBrandDescription}
                    onChange={e => setNewBrandDescription(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddBrand}
                      className="px-3 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-brand-600 hover:bg-brand-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddBrand(false)}
                      className="px-3 py-2 text-sm font-medium transition-colors bg-white border rounded-lg text-slate-700 border-slate-300 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </FormField>
          </div>
          
          <FormField label="Title" required error={errors.title}>
            <input type="text" className={inputClass} placeholder="Event title" value={form.title} onChange={e => update('title', e.target.value)} />
          </FormField>

          <FormField label="Description" error={errors.description}>
            <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Brief description" value={form.description} onChange={e => update('description', e.target.value)} />
          </FormField>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
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

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="Price (USD)" hint="Leave empty or 0 for free" error={errors.price}>
              <input type="number" min="0" step="0.01" className={inputClass} placeholder="0.00" value={form.price} onChange={e => update('price', e.target.value)} />
            </FormField>
            <FormField label="Capacity" hint="Leave empty for unlimited" error={errors.capacity}>
              <input type="number" min="1" className={inputClass} placeholder="Unlimited" value={form.capacity} onChange={e => update('capacity', e.target.value)} />
            </FormField>
          </div>

          {errors.submit && (
            <p className="px-4 py-3 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">{errors.submit}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate(`/admin/events/${eventId}`)} className="px-4 py-2 text-sm font-medium transition-colors bg-white border rounded-lg text-slate-700 border-slate-300 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed">
              <Save className="w-4 h-4" />
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
