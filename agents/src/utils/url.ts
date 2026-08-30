import { createHash } from 'crypto';

export function sha1Short(input: string, len = 20): string {
  return createHash('sha1').update(input).digest('hex').slice(0, len);
}

export interface NormalizedUrl {
  url: string;
  host: string;
}

export function normalizeUrl(raw: string): NormalizedUrl | null {
  try {
    const u = new URL(raw.trim());
    if (!/^https?:$/.test(u.protocol)) return null;
    u.hash = '';
    const drop = [...u.searchParams.keys()].filter((k) =>
      /^(utm_|fbclid|gclid|ref)/i.test(k)
    );
    drop.forEach((k) => u.searchParams.delete(k));
    let path = u.pathname.replace(/\/+$/, '');
    if (!path) path = '/';
    return {
      url: `${u.origin}${path}${u.search}`,
      host: u.hostname.replace(/^www\./, ''),
    };
  } catch {
    return null;
  }
}
