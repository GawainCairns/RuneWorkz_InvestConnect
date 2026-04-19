import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { eventService } from '../services/eventService';
import { brandService } from '../services/brandService';
import type { ApiEvent, Brand } from '../types/api';
import type { Event } from '../types/organizer';

interface EventContextValue {
  events: Event[];
  loading: boolean;
  error: string | null;
  fetchEvents: () => Promise<void>;
  createEvent: (data: Omit<Event, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => Promise<Event>;
  updateEvent: (id: string, data: Partial<Event>) => Promise<Event>;
  deleteEvent: (id: string) => Promise<void>;
  getEvent: (id: string) => Event | undefined;
  // Brands
  brands: Record<string, string>;
  fetchBrands: () => Promise<void>;
  createBrand: (payload: { name: string; description: string }) => Promise<Brand>;
  updateBrand: (id: number, payload: Partial<{ name: string; description: string }>) => Promise<void>;
  deleteBrand: (id: number) => Promise<void>;
}

const EventContext = createContext<EventContextValue | null>(null);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [brands, setBrands] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // fetch brands and events in parallel, then map to local Event type
      const [brandRes, eventRes] = await Promise.all([brandService.getAll(), eventService.getAll()]);
      const apiBrands: Brand[] = (brandRes && (brandRes as any).brands) || [];
      const brandMap: Record<string, string> = apiBrands.reduce((acc, b) => {
        acc[String(b.id)] = b.name;
        return acc;
      }, {} as Record<string, string>);
      setBrands(brandMap);

      const apiEvents: ApiEvent[] = (eventRes && (eventRes as any).events) || [];
      const mapped = apiEvents.map(e => ({
        id: String(e.id),
        // prefer brand name when available, otherwise fallback to id string
        brand: brandMap[String(e.brandId ?? '')] ?? String(e.brandId ?? ''),
        title: e.title || '',
        description: e.description || '',
        date: e.date || '',
        start_time: e.startTime || '',
        end_time: e.endTime || '',
        location: e.location || '',
        price: e.price || 0,
        capacity: e.capacity ?? null,
        tenant_id: '',
        created_at: e.createdAt || '',
        updated_at: e.updatedAt || '',
      }));
      setEvents(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const res = await brandService.getAll();
      const apiBrands: Brand[] = (res && (res as any).brands) || [];
      const brandMap: Record<string, string> = apiBrands.reduce((acc, b) => {
        acc[String(b.id)] = b.name;
        return acc;
      }, {} as Record<string, string>);
      setBrands(brandMap);
    } catch (err) {
      // ignore errors for brands fetch
    }
  }, []);

  const createEvent = useCallback(
    async (data: Omit<Event, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<Event> => {
      // Determine brandId: `data.brand` may be an id string or a name.
      let brandId: number | null = null;
      if (data.brand) {
        // If it's a numeric id string, use it directly
        if (/^\d+$/.test(String(data.brand))) {
          brandId = Number(data.brand);
        } else {
          // Try to find an existing brand id by name
          const found = Object.entries(brands).find(([, name]) => name === data.brand);
          if (found) brandId = Number(found[0]);
        }
      }

      // If we still don't have a brandId, attempt to create the brand
      if (!brandId) {
        try {
          const created = await brandService.create({ name: String(data.brand), description: '' });
          brandId = (created && (created as any).brand && (created as any).brand.id) || null;
          // refresh brands map
          await fetchBrands();
        } catch (err) {
          throw new Error('Failed to resolve or create brand');
        }
      }

      if (!brandId) throw new Error('Brand id not available');

      const payload = {
        brandId,
        title: data.title,
        date: data.date,
        location: data.location,
        price: data.price ?? 0,
        capacity: data.capacity ?? 0,
        description: data.description || undefined,
        startTime: data.start_time || undefined,
        endTime: data.end_time || undefined,
      };

      const res = await eventService.create(payload as any);
      const apiEvent: ApiEvent = (res && (res as any).event) as ApiEvent;
      const mapped: Event = {
        id: String(apiEvent.id),
        brand: brands[String(apiEvent.brandId)] ?? String(apiEvent.brandId),
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
      setEvents(prev => [...prev, mapped]);
      return mapped;
    },
    [brands, fetchBrands]
  );

  const updateEvent = useCallback(async (id: string, data: Partial<Event>): Promise<Event> => {
    let updated: Event | undefined;
    setEvents(prev =>
      prev.map(e => {
        if (e.id === id) {
          updated = { ...e, ...data, updated_at: new Date().toISOString() };
          return updated;
        }
        return e;
      })
    );
    if (!updated) throw new Error('Event not found');
    return updated;
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const getEvent = useCallback((id: string) => events.find(e => e.id === id), [events]);

  const { profile } = useAuth();

  useEffect(() => {
    // Fetch events when a user logs in (profile becomes available).
    // Clear events on logout.
    if (profile) {
      fetchEvents().catch(() => {});
    } else {
      setEvents([]);
    }
  }, [profile, fetchEvents]);

  return (
    <EventContext.Provider
      value={{
        events,
        loading,
        error,
        fetchEvents,
        createEvent,
        updateEvent,
        deleteEvent,
        getEvent,
        // brands
        brands,
        fetchBrands,
        createBrand: async payload => {
          const res = await brandService.create(payload);
          await fetchBrands();
          return (res && (res as any).brand) as Brand;
        },
        updateBrand: async (id, payload) => {
          await brandService.update(id, payload as any);
          await fetchBrands();
        },
        deleteBrand: async id => {
          await brandService.delete(id);
          await fetchBrands();
        },
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvents must be used within EventProvider');
  return ctx;
}
