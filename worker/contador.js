// Contador global de imágenes del día + última imagen generada.
// Un único Durable Object ("global"): todas las visitas del mundo pasan por el mismo contador,
// así el tope diario es exacto. Se reinicia a las 00:00 UTC, igual que la cuota gratis de Workers AI.
import { DurableObject } from 'cloudflare:workers';

export class Contador extends DurableObject {
  // Devuelve true y suma 1 si aún queda cupo hoy; false si ya se llegó al tope.
  async reservar(tope) {
    const hoy = new Date().toISOString().slice(0, 10);
    const s = this.ctx.storage;
    let n = (await s.get('dia')) === hoy ? (await s.get('n')) || 0 : 0;
    if (n >= tope) return false;
    await s.put({ dia: hoy, n: n + 1 });
    return true;
  }
  async guardar(b64) { await this.ctx.storage.put('ultima', b64); }
  async ultima() { return (await this.ctx.storage.get('ultima')) || null; }
  async estado() {
    const s = this.ctx.storage;
    return { dia: await s.get('dia'), imagenes: (await s.get('n')) || 0 };
  }
}
