import type { Model, Snapshot } from '../src/shared';
interface Env { DB: D1Database; ICONS: R2Bucket; ASSETS: Fetcher }
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    if (url.pathname === '/api/snapshot') {
      try {
        const { results } = await env.DB.prepare(`SELECT m.*, p.name AS provider, p.icon_key
          FROM models m JOIN providers p ON p.id = m.provider_id ORDER BY m.display_order`).all<Model>();
        const dates = results.map(m => m.data_date).sort();
        const snapshot: Snapshot = { models: results, dataDate: dates.at(-1) ?? null };
        return Response.json(snapshot, { headers: { 'Cache-Control': 'no-store' } });
      } catch (error) {
        console.error('D1 query failed', error);
        return Response.json({ error: '暂时无法读取模型数据，请稍后重试。' }, { status: 503 });
      }
    }
    if (url.pathname.startsWith('/icons/')) {
      const key = url.pathname.slice('/icons/'.length);
      if (!/^providers\/[a-z0-9-]+\.svg$/.test(key)) return new Response('Not found', { status: 404 });
      const object = await env.ICONS.get(key);
      if (!object) return new Response('Not found', { status: 404 });
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('Content-Type', 'image/svg+xml');
      headers.set('ETag', object.httpEtag);
      headers.set('Cache-Control', 'public, max-age=3600');
      headers.set('X-Content-Type-Options', 'nosniff');
      const matches = request.headers.get('If-None-Match')?.split(',').some(tag =>
        tag.trim() === '*' || tag.trim().replace(/^W\//, '') === object.httpEtag
      );
      if (matches) return new Response(null, { status: 304, headers });
      return new Response(request.method === 'HEAD' ? null : object.body, { headers });
    }
    if (url.pathname.startsWith('/api/')) return new Response('Not found', { status: 404 });
    return env.ASSETS.fetch(request);
  }
} satisfies ExportedHandler<Env>;
