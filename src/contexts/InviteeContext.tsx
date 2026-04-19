import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useEvents } from './EventContext';
import { inviteeService } from '../services/inviteeService';
import type { ApiInvitee } from '../types/api';
import type { Invitee } from '../types/organizer';

interface InviteeContextValue {
  invitees: Invitee[];
  loading: boolean;
  error: string | null;
  fetchInvitees: (eventId: string) => Promise<void>;
  addInvitee: (data: Omit<Invitee, 'id' | 'invite_token' | 'created_at'>) => Promise<Invitee>;
  addInvitees: (data: Omit<Invitee, 'id' | 'invite_token' | 'created_at'>[]) => Promise<Invitee[]>;
  updateInvitee: (id: string, data: Partial<Invitee>) => Promise<Invitee>;
  updateInviteeLocal: (id: string, data: Partial<Invitee>) => void;
  markPaid: (id: string) => Promise<void>;
  getInviteeByToken: (token: string) => Invitee | undefined;
}

const InviteeContext = createContext<InviteeContextValue | null>(null);

export function InviteeProvider({ children }: { children: React.ReactNode }) {
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitees = useCallback(async (_eventId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await inviteeService.getAll({ eventId: Number(_eventId) } as any);
      const apiInvitees: ApiInvitee[] = (res && (res as any).invitees) || [];
      const mapped = apiInvitees.map(i => ({
        id: String(i.id),
        event_id: String(i.eventId),
        email: i.email || '',
        firstname: i.firstname || '',
        lastname: i.surname || '',
        dietary: i.dietary || '',
        rsvp_status: (i.rsvpStatus as any) || 'pending',
        payment_status: (i.paymentStatus as any) || 'unpaid',
        invite_token: (i.inviteCode as any) || '',
        created_at: i.createdAt || '',
      }));
      // replace invitees for this event
      setInvitees(prev => {
        // remove any existing for this event and append fetched
        const others = prev.filter(inv => inv.event_id !== String(_eventId));
        return [...others, ...mapped];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invitees');
    } finally {
      setLoading(false);
    }
  }, []);

  const addInvitee = useCallback(async (data: Omit<Invitee, 'id' | 'invite_token' | 'created_at'>): Promise<Invitee> => {
    try {
      const payload = {
        eventId: Number(data.event_id),
        firstname: data.firstname,
        surname: data.lastname,
        email: data.email,
        dietary: data.dietary || undefined,
        rsvpStatus: data.rsvp_status || undefined,
        paymentStatus: data.payment_status || undefined,
      } as any;
      const res = await inviteeService.create(payload);
      const apiInv = (res && (res as any).invitee) as ApiInvitee;
      const newInvitee: Invitee = {
        id: String(apiInv.id),
        event_id: String(apiInv.eventId),
        email: apiInv.email || '',
        firstname: apiInv.firstname || '',
        lastname: apiInv.surname || '',
        dietary: apiInv.dietary || '',
        rsvp_status: (apiInv.rsvpStatus as any) || 'pending',
        payment_status: (apiInv.paymentStatus as any) || 'unpaid',
        invite_token: (apiInv.inviteCode as any) || '',
        created_at: apiInv.createdAt || new Date().toISOString(),
      };
      setInvitees(prev => [...prev, newInvitee]);
      return newInvitee;
    } catch (err) {
      // fallback to local optimistic add on error
      const newInvitee: Invitee = {
        ...data,
        id: crypto.randomUUID(),
        invite_token: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };
      setInvitees(prev => [...prev, newInvitee]);
      return newInvitee;
    }
  }, []);

  const addInvitees = useCallback(async (data: Omit<Invitee, 'id' | 'invite_token' | 'created_at'>[]): Promise<Invitee[]> => {
    try {
      const payloads = data.map(d => ({
        eventId: Number(d.event_id),
        firstname: d.firstname,
        surname: d.lastname,
        email: d.email,
        dietary: d.dietary || undefined,
        rsvpStatus: d.rsvp_status || undefined,
        paymentStatus: d.payment_status || undefined,
      }));
      const res = await inviteeService.createBatch(payloads as any);
      const results = (res && (res as any).results) || [];
      const created: Invitee[] = results
        .filter((r: any) => r.success && r.invitee)
        .map((r: any) => {
          const i = r.invitee as ApiInvitee;
          return {
            id: String(i.id),
            event_id: String(i.eventId),
            email: i.email || '',
            firstname: i.firstname || '',
            lastname: i.surname || '',
            dietary: i.dietary || '',
            rsvp_status: (i.rsvpStatus as any) || 'pending',
            payment_status: (i.paymentStatus as any) || 'unpaid',
            invite_token: (i.inviteCode as any) || '',
            created_at: i.createdAt || new Date().toISOString(),
          } as Invitee;
        });
      // if some failed, fallback create local entries for them
      const failedPayloads = results.filter((r: any) => !r.success).map((r: any) => r.item as any);
      const fallback: Invitee[] = failedPayloads.map((p: any) => ({
        id: crypto.randomUUID(),
        event_id: String(p.eventId || (data[0] && data[0].event_id)),
        email: p.email || '',
        firstname: p.firstname || '',
        lastname: p.surname || '',
        dietary: p.dietary || '',
        rsvp_status: (p.rsvpStatus as any) || 'pending',
        payment_status: (p.paymentStatus as any) || 'unpaid',
        invite_token: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      }));
      const newInvitees = [...created, ...fallback];
      setInvitees(prev => [...prev, ...newInvitees]);
      return newInvitees;
    } catch (err) {
      const newInvitees: Invitee[] = data.map(d => ({
        ...d,
        id: crypto.randomUUID(),
        invite_token: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      }));
      setInvitees(prev => [...prev, ...newInvitees]);
      return newInvitees;
    }
  }, []);

  const updateInvitee = useCallback(async (id: string, data: Partial<Invitee>): Promise<Invitee> => {
    let updated: Invitee | undefined;
    setInvitees(prev =>
      prev.map(inv => {
        if (inv.id === id) {
          updated = { ...inv, ...data };
          return updated;
        }
        return inv;
      })
    );
    if (!updated) throw new Error('Invitee not found');
    return updated;
  }, []);

  const updateInviteeLocal = useCallback((id: string, data: Partial<Invitee>) => {
    setInvitees(prev =>
      prev.map(inv => (inv.id === id ? { ...inv, ...data } : inv))
    );
  }, []);

  const markPaid = useCallback(async (id: string) => {
    setInvitees(prev =>
      prev.map(inv => (inv.id === id ? { ...inv, payment_status: 'paid' } : inv))
    );
  }, []);

  const getInviteeByToken = useCallback(
    (token: string) => invitees.find(inv => inv.invite_token === token),
    [invitees]
  );

  const { token, profile } = useAuth();
  const { events } = useEvents();

  useEffect(() => {
    if (!token) return;
    if (!events || events.length === 0) return;

    // load invitees for events that don't yet have invitees loaded
    for (const ev of events) {
      const hasForEvent = invitees.some(i => i.event_id === ev.id);
      if (!hasForEvent) {
        fetchInvitees(ev.id).catch(() => {});
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, profile, events]);

  return (
    <InviteeContext.Provider value={{ invitees, loading, error, fetchInvitees, addInvitee, addInvitees, updateInvitee, updateInviteeLocal, markPaid, getInviteeByToken }}>
      {children}
    </InviteeContext.Provider>
  );
}

export function useInvitees() {
  const ctx = useContext(InviteeContext);
  if (!ctx) throw new Error('useInvitees must be used within InviteeProvider');
  return ctx;
}
