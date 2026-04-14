import React, { createContext, useCallback, useContext, useState } from 'react';
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
}

const EventContext = createContext<EventContextValue | null>(null);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEvents([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvent = useCallback(async (data: Omit<Event, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<Event> => {
    const newEvent: Event = {
      ...data,
      id: crypto.randomUUID(),
      tenant_id: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  }, []);

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

  return (
    <EventContext.Provider value={{ events, loading, error, fetchEvents, createEvent, updateEvent, deleteEvent, getEvent }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvents must be used within EventProvider');
  return ctx;
}
