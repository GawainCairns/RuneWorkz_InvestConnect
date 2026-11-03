import { apiGet, apiPost } from './api';

export const IMAGINARY_BASE_URL =
  (import.meta.env.VITE_IMAGINARY_API_BASE_URL as string | undefined) ?? 'https://imaginary.runeworkz.com';

export interface ImageTransform {
  w?: number;
  h?: number;
  q?: number;
}

export interface UploadImageResult {
  image_code: string;
  url: string;
  eventProperty?: { id: number; eventId: number; name: string; value: string };
}

export interface UploadImageOptions {
  folder?: string;
  /** When set, the image code is saved as an event property called `name`. */
  eventId?: number;
  name?: string;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function buildImageUrl(imageCode: string, { w, h, q }: ImageTransform = {}): string {
  const parts: string[] = [];
  if (w) parts.push(`w_${w}`);
  if (h) parts.push(`h_${h}`);
  if (q) parts.push(`q_${q}`);
  const prefix = parts.length ? `${parts.join(',')}/` : '';
  return `${IMAGINARY_BASE_URL}/${prefix}${imageCode}`;
}

export const imageService = {
  async upload(file: File, options: UploadImageOptions = {}): Promise<UploadImageResult> {
    if (!file.type.startsWith('image/')) {
      throw new Error('Selected file is not an image');
    }
    const file_base64 = await readAsDataUrl(file);
    return apiPost<UploadImageResult>('/images', {
      file_base64,
      filename: file.name,
      folder: options.folder ?? 'default',
      ...(options.eventId !== undefined ? { eventId: options.eventId, name: options.name } : {}),
    });
  },

  getUrl(imageCode: string, params: ImageTransform = {}): Promise<{ image_code: string; url: string }> {
    return apiGet(`/images/${encodeURIComponent(imageCode)}/url`, { ...params });
  },

  buildUrl: buildImageUrl,
};
