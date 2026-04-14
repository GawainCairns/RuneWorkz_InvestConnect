import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './api';
import type { Brand, BrandProperty } from '../types/api';

// ─── Brands ───────────────────────────────────────────────────────────────────

export const brandService = {
  getAll(): Promise<{ brands: Brand[] }> {
    return apiGet('/brands');
  },

  getById(id: number): Promise<{ brand: Brand }> {
    return apiGet(`/brands/${id}`);
  },

  create(payload: { name: string; description: string }): Promise<{ brand: Brand }> {
    return apiPost('/brands', payload);
  },

  replace(id: number, payload: { name: string; description: string }): Promise<{ brand: Brand }> {
    return apiPut(`/brands/${id}`, payload);
  },

  update(id: number, payload: Partial<{ name: string; description: string }>): Promise<{ brand: Brand }> {
    return apiPatch(`/brands/${id}`, payload);
  },

  delete(id: number): Promise<{ success: boolean }> {
    return apiDelete(`/brands/${id}`);
  },
};

// ─── Brand Properties ─────────────────────────────────────────────────────────

export interface CreateBrandPropertyPayload {
  brandId: number;
  value: string;
  name?: string;
}

export const brandPropertyService = {
  getAll(): Promise<{ brandProperties: BrandProperty[] }> {
    return apiGet('/brand-properties');
  },

  getByBrand(brandId: number): Promise<{ brandProperties: BrandProperty[] }> {
    return apiGet(`/brand-properties/brand/${brandId}`);
  },

  getById(id: number): Promise<{ brandProperty: BrandProperty }> {
    return apiGet(`/brand-properties/${id}`);
  },

  create(payload: CreateBrandPropertyPayload): Promise<{ brandProperty: BrandProperty }> {
    return apiPost('/brand-properties', payload);
  },

  replace(id: number, payload: CreateBrandPropertyPayload): Promise<{ brandProperty: BrandProperty }> {
    return apiPut(`/brand-properties/${id}`, payload);
  },

  update(id: number, payload: Partial<CreateBrandPropertyPayload>): Promise<{ brandProperty: BrandProperty }> {
    return apiPatch(`/brand-properties/${id}`, payload);
  },

  delete(id: number): Promise<{ success: boolean }> {
    return apiDelete(`/brand-properties/${id}`);
  },
};
