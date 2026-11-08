// miguelo.com: web estática + /bg (fondo generado con IA)
import { fondo } from './bg.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/bg' && request.method === 'GET') {
      return fondo(request, env, (p) => ctx.waitUntil(p));
    }
    return env.ASSETS.fetch(request);
  },
};
