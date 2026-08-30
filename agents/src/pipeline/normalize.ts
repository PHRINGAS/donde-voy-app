import { PlaceInput, PlaceRow } from '../types';

export function normalizeNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(bar|restaurante|restaurant|cafe|confiteria)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function toPlaceRow(input: PlaceInput): PlaceRow {
  const tags = input.tags ?? {};
  const social = extraerRedes(tags, input);
  return {
    ...input,
    nombre_normalizado: normalizeNombre(input.nombre),
    provincia: 'Buenos Aires',
    instagram: social.instagram,
    facebook: social.facebook,
    web: input.web ?? social.web,
    telefono: limpiarTelefono(input.telefono),
    tags,
  };
}

function extraerRedes(
  tags: Record<string, unknown>,
  input: PlaceInput
): { instagram?: string; facebook?: string; web?: string } {
  let instagram: string | undefined;
  let facebook: string | undefined;
  if (typeof tags.contact_instagram === 'string') instagram = limpiarHandle(tags.contact_instagram);
  if (typeof tags['contact:instagram'] === 'string') instagram = limpiarHandle(tags['contact:instagram']);
  if (typeof tags.instagram === 'string') instagram = limpiarHandle(tags.instagram);
  if (typeof tags.facebook === 'string') facebook = limpiarUrlSocial(tags.facebook);
  const web =
    pickString(tags.website) ??
    pickString(tags['contact:website']) ??
    pickString(tags.url);
  void input;
  return { instagram, facebook, web };
}

function pickString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function limpiarHandle(v: string): string | undefined {
  const sinUrl = v.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[/?#].*$/, '');
  const handle = sinUrl.replace(/^@/, '').trim();
  return handle || undefined;
}

function limpiarUrlSocial(v: string): string | undefined {
  const url = v.startsWith('http') ? v : `https://www.facebook.com/${v.replace(/^@/, '')}`;
  try {
    new URL(url);
    return url;
  } catch {
    return undefined;
  }
}

function limpiarTelefono(tel: string | null | undefined): string | null {
  if (!tel) return null;
  const limpio = tel.split(';')[0].replace(/[^\d+]/g, '');
  return limpio.length >= 6 ? limpio : null;
}
