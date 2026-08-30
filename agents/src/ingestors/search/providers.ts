export interface SearchResult {
  url: string;
  title?: string;
  snippet?: string;
}

export interface SearchProvider {
  readonly name: string;
  readonly enabled: boolean;
  search(query: string, limit: number): Promise<SearchResult[]>;
}

export function pickProvider(): SearchProvider | null {
  const providers = [braveProvider(), tavilyProvider(), googleCseProvider()];
  return providers.find((p) => p.enabled) ?? null;
}

function braveProvider(): SearchProvider {
  const key = process.env.BRAVE_API_KEY ?? '';
  return {
    name: 'brave',
    enabled: Boolean(key),
    async search(query, limit) {
      const url = new URL('https://api.search.brave.com/res/v1/web/search');
      url.searchParams.set('q', query);
      url.searchParams.set('country', 'ar');
      url.searchParams.set('search_lang', 'es');
      url.searchParams.set('count', String(Math.min(limit, 20)));
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'X-Subscription-Token': key },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`brave HTTP ${res.status}`);
      const json = (await res.json()) as {
        web?: { results?: Array<{ url: string; title?: string; description?: string }> };
      };
      return (json.web?.results ?? []).map((r) => ({
        url: r.url,
        title: r.title,
        snippet: r.description,
      }));
    },
  };
}

function tavilyProvider(): SearchProvider {
  const key = process.env.TAVILY_API_KEY ?? '';
  return {
    name: 'tavily',
    enabled: Boolean(key),
    async search(query, limit) {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: key,
          query,
          max_results: Math.min(limit, 10),
          include_domains: ['ar'],
          search_depth: 'basic',
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`tavily HTTP ${res.status}`);
      const json = (await res.json()) as {
        results?: Array<{ url: string; title?: string; content?: string }>;
      };
      return (json.results ?? []).map((r) => ({
        url: r.url,
        title: r.title,
        snippet: r.content,
      }));
    },
  };
}

function googleCseProvider(): SearchProvider {
  const key = process.env.GOOGLE_CSE_KEY ?? '';
  const cx = process.env.GOOGLE_CSE_ID ?? '';
  return {
    name: 'google_cse',
    enabled: Boolean(key && cx),
    async search(query, limit) {
      const url = new URL('https://www.googleapis.com/customsearch/v1');
      url.searchParams.set('key', key);
      url.searchParams.set('cx', cx);
      url.searchParams.set('q', query);
      url.searchParams.set('num', String(Math.min(limit, 10)));
      url.searchParams.set('gl', 'ar');
      url.searchParams.set('hl', 'es');
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`google_cse HTTP ${res.status}`);
      const json = (await res.json()) as {
        items?: Array<{ link: string; title?: string; snippet?: string }>;
      };
      return (json.items ?? []).map((r) => ({
        url: r.link,
        title: r.title,
        snippet: r.snippet,
      }));
    },
  };
}
