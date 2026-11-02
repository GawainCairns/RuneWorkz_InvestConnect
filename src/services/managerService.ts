import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './api';
import type { Manager } from '../types/api';

export interface ManagerPayload {
  eventId: number;
  name: string;
  email: string;
}

export const managerService = {
  getAll(eventId?: number): Promise<{ managers: Manager[] }> {
    const query = eventId !== undefined ? `?eventId=${encodeURIComponent(eventId)}` : '';
    return apiGet(`/managers${query}`);
  },

  getById(id: number): Promise<{ manager: Manager }> {
    return apiGet(`/managers/${id}`);
  },

  create(payload: ManagerPayload): Promise<{ manager: Manager }> {
    return apiPost('/managers', payload);
  },

  replace(id: number, payload: ManagerPayload): Promise<{ manager: Manager }> {
    return apiPut(`/managers/${id}`, payload);
  },

  update(id: number, payload: Partial<ManagerPayload>): Promise<{ manager: Manager }> {
    return apiPatch(`/managers/${id}`, payload);
  },

  delete(id: number): Promise<{ success: boolean }> {
    return apiDelete(`/managers/${id}`);
  },
};
