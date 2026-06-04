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
  /** Fetches the invitee from the API by invite-code across all provided event IDs.
   *  Useful for public (unauthenticated) attendee flows where the context starts empty. */
  resolveInviteeByToken: (token: string, eventIds: string[]) => Promise<Invitee | undefined>;
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
    // basic validation
    if (!data.event_id) throw new Error('Event is required');
    if (!data.firstname || data.firstname.trim() === '') throw new Error('First name is required');
    if (!data.lastname || data.lastname.trim() === '') throw new Error('Last name is required');
    if (!data.email || data.email.trim() === '') throw new Error('Email is required');
    // simple email format check
    const emailNorm = data.email.trim().toLowerCase();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(emailNorm)) throw new Error('Email is not valid');

    // duplicate check within current state by event
    const exists = invitees.some(inv => inv.event_id === String(data.event_id) && (
      (inv.email || '').toLowerCase() === emailNorm ||
      ((inv.firstname || '').toLowerCase() === data.firstname.trim().toLowerCase() && (inv.lastname || '').toLowerCase() === data.lastname.trim().toLowerCase())
    ));
    if (exists) throw new Error('Invitee already exists for this event');

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
      // do not add a frontend-generated invitee when the API fails; propagate the error
      throw err instanceof Error ? err : new Error('Failed to create invitee');
    }
  }, []);

  const addInvitees = useCallback(async (data: Omit<Invitee, 'id' | 'invite_token' | 'created_at'>[]): Promise<Invitee[]> => {
    // validate all entries and check duplicates vs current state and within batch
    if (!Array.isArray(data) || data.length === 0) throw new Error('No invitees provided');
    const seenInBatch = new Set<string>();
    for (const d of data) {
      if (!d.event_id) throw new Error('Event is required for all invitees');
      if (!d.firstname || d.firstname.trim() === '') throw new Error('First name is required for all invitees');
      if (!d.lastname || d.lastname.trim() === '') throw new Error('Last name is required for all invitees');
      if (!d.email || d.email.trim() === '') throw new Error('Email is required for all invitees');
      const emailNorm = d.email.trim().toLowerCase();
      const key = `${d.event_id}::${emailNorm}`;
      if (seenInBatch.has(key)) throw new Error('Duplicate invitee in batch');
      seenInBatch.add(key);

      const exists = invitees.some(inv => inv.event_id === String(d.event_id) && (
        (inv.email || '').toLowerCase() === emailNorm ||
        ((inv.firstname || '').toLowerCase() === d.firstname.trim().toLowerCase() && (inv.lastname || '').toLowerCase() === d.lastname.trim().toLowerCase())
      ));
      if (exists) throw new Error(`Invitee ${d.firstname} ${d.lastname} already exists for event ${d.event_id}`);
    }

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
      // only use invitees returned by the API; do not create frontend fallbacks
      setInvitees(prev => [...prev, ...created]);
      return created;
    } catch (err) {
      // propagate error instead of adding local entries
      throw err instanceof Error ? err : new Error('Failed to create invitees');
    }
  }, []);

  const updateInvitee = useCallback(async (id: string, data: Partial<Invitee>): Promise<Invitee> => {
    let updated: Invitee | undefined;
    setInvitees(prev =>
      prev.map(inv => {
        if (inv.id === id) {
          updated = { ...inv, ...data };
          return updated as Invitee;
        }
        return inv;
      })
    );
    if (!updated) throw new Error('Invitee not found');

    // attempt to persist to backend; map fields to API payload shape
    try {
      const payload: any = {};
      if (data.rsvp_status !== undefined) payload.rsvpStatus = data.rsvp_status;
      if (data.dietary !== undefined) payload.dietary = data.dietary;
      if (data.payment_status !== undefined) payload.paymentStatus = data.payment_status;
      if ((data as any).firstname !== undefined) payload.firstname = (data as any).firstname;
      if ((data as any).lastname !== undefined) payload.surname = (data as any).lastname;
      if ((data as any).email !== undefined) payload.email = (data as any).email;

      const res = await inviteeService.update(Number(id), payload);
      const apiInv = (res && (res as any).invitee) as ApiInvitee;
      const merged: Invitee = {
        id: String(apiInv.id),
        event_id: String(apiInv.eventId),
        email: apiInv.email || updated.email,
        firstname: apiInv.firstname || updated.firstname,
        lastname: apiInv.surname || updated.lastname,
        dietary: apiInv.dietary || updated.dietary,
        rsvp_status: (apiInv.rsvpStatus as any) || updated.rsvp_status,
        payment_status: (apiInv.paymentStatus as any) || updated.payment_status,
        invite_token: (apiInv.inviteCode as any) || updated.invite_token,
        created_at: apiInv.createdAt || updated.created_at,
        invoice: (updated as any).invoice,
      };
      setInvitees(prev => prev.map(inv => (inv.id === id ? merged : inv)));
      return merged;
    } catch (err) {
      // If backend fails, return the optimistic updated object
      return updated as Invitee;
    }
  }, []);

  const updateInviteeLocal = useCallback((id: string, data: Partial<Invitee>) => {
    setInvitees(prev =>
      prev.map(inv => (inv.id === id ? { ...inv, ...data } : inv))
    );
  }, []);

  const markPaid = useCallback(async (id: string) => {
    setInvitees(prev => prev.map(inv => (inv.id === id ? { ...inv, payment_status: 'paid' } : inv)));
    try {
      await inviteeService.updatePayment(Number(id), 'paid');
    } catch (err) {
      // ignore backend error; local state already updated optimistically
    }
  }, []);

  const getInviteeByToken = useCallback(
    (token: string) => invitees.find(inv => inv.invite_token === token),
    [invitees]
  );

  const resolveInviteeByToken = useCallback(
    async (token: string, eventIds: string[]): Promise<Invitee | undefined> => {
      // Check in-memory first
      const cached = invitees.find(inv => inv.invite_token === token);
      if (cached) return cached;

      if (!eventIds.length) return undefined;

      try {
        // Race all events in parallel – exactly one should resolve
        const res = await Promise.any(
          eventIds.map(eventId => inviteeService.getByCode(Number(eventId), token))
        );
        const i = res.invitee;
        const resolved: Invitee = {
          id: String(i.id),
          event_id: String(i.eventId),
          email: i.email || '',
          firstname: i.firstname || '',
          lastname: i.surname || '',
          dietary: i.dietary || '',
          rsvp_status: (i.rsvpStatus as any) || 'pending',
          payment_status: (i.paymentStatus as any) || 'unpaid',
          invite_token: (i.inviteCode as any) || token,
          created_at: i.createdAt || '',
        };
        setInvitees(prev =>
          prev.some(inv => inv.id === resolved.id) ? prev : [...prev, resolved]
        );
        return resolved;
      } catch {
        return undefined;
      }
    },
    [invitees]
  );

  const { token, profile } = useAuth();
  const { events } = useEvents();

  useEffect(() => {
    if (!token) return;
    if (!events || events.length === 0) return;

    // load invitees for events that don't yet have invitees loaded
    const missingEventIds = events
      .filter(ev => !invitees.some(i => i.event_id === ev.id))
      .map(ev => ev.id);

    if (missingEventIds.length === 0) return;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.allSettled(
          missingEventIds.map(id => inviteeService.getAll({ eventId: Number(id) } as any))
        );

        const apiInvitees: ApiInvitee[] = [];
        for (const r of results) {
          if (r.status === 'fulfilled') {
            const res = r.value as any;
            const items: ApiInvitee[] = (res && res.invitees) || [];
            apiInvitees.push(...items);
          }
        }

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

        setInvitees(prev => {
          // remove any existing for these events and append fetched
          const others = prev.filter(inv => !missingEventIds.includes(inv.event_id));
          return [...others, ...mapped];
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch invitees');
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, profile, events]);

  return (
    <InviteeContext.Provider value={{ invitees, loading, error, fetchInvitees, addInvitee, addInvitees, updateInvitee, updateInviteeLocal, markPaid, getInviteeByToken, resolveInviteeByToken }}>
      {children}
    </InviteeContext.Provider>
  );
}

export function useInvitees() {
  const ctx = useContext(InviteeContext);
  if (!ctx) throw new Error('useInvitees must be used within InviteeProvider');
  return ctx;
}
