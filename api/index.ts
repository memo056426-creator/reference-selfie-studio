import type { IncomingMessage, ServerResponse } from 'node:http';
import appPromise from '../server.ts';

// Forward the original API slug from Vercel's rewrite to Express.
type ApiRequest = IncomingMessage & {
  query?: { endpoint?: string | string[] };
};

export default async function handler(req: ApiRequest, res: ServerResponse) {
  const rawEndpoint = req.query?.endpoint;
  const endpoint = typeof rawEndpoint === 'string' ? rawEndpoint : '';
  if (!/^[a-z0-9/-]+$/i.test(endpoint)) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }
  // Every supported route is prefixed with /api/ in the existing Express app.
  req.url = `/api/${endpoint}`;
  const app = await appPromise;
  app(req, res);
}
