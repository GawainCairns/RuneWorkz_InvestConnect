import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEvents } from '../contexts/EventContext';
import { useInvitees } from '../contexts/InviteeContext';
import type { Event, Invitee } from '../types/organizer';

/**
 * Shared hook for attendee RSVP pages.
 * Resolves the invitee from context or the API. If the invitee cannot be found
 * after events have loaded (e.g. incognito, direct deep-link), redirects back
 * to the invitation landing page so the user can re-enter the flow cleanly.
 */
export function useAttendeeRoute(): {
  token: string | undefined;
  invitee: Invitee | undefined;
  event: Event | undefined;
  loading: boolean;
} {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { getInviteeByToken, resolveInviteeByToken } = useInvitees();
  const { getEvent, fetchEvents, events, loading: eventsLoading } = useEvents();

  const [resolving, setResolving] = useState(false);
  const attemptedRef = useRef(false);

  // Ensure events are loaded
  useEffect(() => {
    if (!events.length && !eventsLoading) {
      fetchEvents().catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length, eventsLoading]);

  const invitee = token ? getInviteeByToken(token) : undefined;
  const event = invitee ? getEvent(invitee.event_id) : undefined;

  // When events are loaded and invitee is still missing, try to resolve from API.
  // If still not found, redirect back to the landing page.
  useEffect(() => {
    if (!token || invitee || !events.length || resolving || attemptedRef.current) return;
    attemptedRef.current = true;
    setResolving(true);
    resolveInviteeByToken(token, events.map(e => e.id))
      .then(found => {
        if (!found) navigate(`/rsvp/${token}`, { replace: true });
      })
      .catch(() => navigate(`/rsvp/${token}`, { replace: true }))
      .finally(() => setResolving(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length, token, invitee]);

  return {
    token,
    invitee,
    event,
    loading: eventsLoading || resolving,
  };
}
