import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './api';
import type { ApiEvent, ApiEventFull, ApiEventWithProperties, EventProperty } from '../types/api';

// ─── Events ───────────────────────────────────────────────────────────────────

export interface CreateEventPayload {
  brandId: number;
  title: string;
  date: string;
  location: string;
  price: number;
  capacity: number;
  description?: string;
  btbTime?: string;
  startTime?: string;
  endTime?: string;
}

export const eventService = {
  getAll(): Promise<{ events: ApiEvent[] }> {
    return apiGet('/events');
  },

  getById(id: number): Promise<{ event: ApiEventWithProperties }> {
    return apiGet(`/events/${id}`);
  },

  getFull(id: number): Promise<ApiEventFull> {
    return apiGet(`/events/${id}/full`);
  },

  create(payload: CreateEventPayload): Promise<{ event: ApiEvent }> {
    return apiPost('/events', payload);
  },

  replace(id: number, payload: CreateEventPayload): Promise<{ event: ApiEvent }> {
    return apiPut(`/events/${id}`, payload);
  },

  update(id: number, payload: Partial<CreateEventPayload>): Promise<{ event: ApiEvent }> {
    return apiPatch(`/events/${id}`, payload);
  },

  delete(id: number): Promise<{ success: boolean }> {
    return apiDelete(`/events/${id}`);
  },
};

// ─── Event Properties ─────────────────────────────────────────────────────────

export interface CreateEventPropertyPayload {
  eventId: number;
  value: string;
  name?: string;
}

export const eventPropertyService = {
  getAll(): Promise<{ eventsProperties: EventProperty[] }> {
    return apiGet('/events-properties');
  },

  getByEvent(eventId: number): Promise<{ eventsProperties: EventProperty[] }> {
    return apiGet(`/events-properties/event/${eventId}`);
  },

  getById(id: number): Promise<{ eventProperty: EventProperty }> {
    return apiGet(`/events-properties/${id}`);
  },

  create(payload: CreateEventPropertyPayload): Promise<{ eventProperty: EventProperty }> {
    return apiPost('/events-properties', payload);
  },

  replace(id: number, payload: CreateEventPropertyPayload): Promise<{ eventProperty: EventProperty }> {
    return apiPut(`/events-properties/${id}`, payload);
  },

  update(id: number, payload: Partial<CreateEventPropertyPayload>): Promise<{ eventProperty: EventProperty }> {
    return apiPatch(`/events-properties/${id}`, payload);
  },

  delete(id: number): Promise<{ success: boolean }> {
    return apiDelete(`/events-properties/${id}`);
  },
};
