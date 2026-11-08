// Fondo generado con IA para miguelo.com
// GET /bg -> una imagen nueva (JPEG) creada en el momento con FLUX schnell (Workers AI).
// Solo se guarda la última imagen buena (en el Durable Object Contador), para enseñarla cuando
// se llega al tope diario o algo falla. Si no hay ninguna, la web se queda con su fondo crema.
//
// Los bindings (AI y LIMITE) se declaran en wrangler.jsonc: no hay que tocar nada en el panel.

const LIMITE_POR_IP = 6;        // imágenes por IP...
const VENTANA_SEG = 60 * 60;    // ...cada hora
const PASOS = 4;                // 4 pasos: lo mínimo que da buen resultado y lo más barato

// GASTO 0 €: Workers AI regala 10.000 neuronas al día (se reinician a las 00:00 UTC).
// Cada imagen 1024x1024 con 4 pasos gasta ~58 neuronas (4 tiles x 4,8 + 4 pasos x 9,6).
// Con 120 imágenes/día gastamos ~6.900: quedan ~3.000 de margen y nunca se pasa de lo gratis.
const TOPE_DIARIO = 120;

const BOTS = /bot|crawl|spider|slurp|curl|wget|python|httpclient|headless|lighthouse|preview|facebookexternalhit|whatsapp|telegram|discord|monitor|scan/i;

// ingredientes del prompt: cada visita sale una combinación distinta
const ESCENAS = [
  'a crowd of young people crossing a neon-lit street at night, seen from above',
  'a skateboarder mid-air in front of a huge abstract mural',
  'friends laughing on a rooftop at golden hour, city skyline behind',
  'a dancer frozen mid-move in a subway station',
  'a person with headphones walking through rain-soaked city lights',
  'a busy night market full of people and glowing lanterns',
  'a cyclist speeding through a tunnel of light trails',
  'a group of creatives sketching on a giant wall in a warehouse studio',
  'a woman in streetwear surrounded by floating holographic shapes',
  'a basketball court at dusk with silhouettes of players',
  'a portrait of a man in a hoodie lit by colorful screens',
  'people dancing at an open-air party under spotlights',
];
const ESTILOS = [
  'surreal generative art, liquid chrome and glass shapes',
  'double exposure with flowing particles and light',
  'risograph poster aesthetic, bold grain and halftone',
  'dreamy cinematic photography, heavy bokeh, motion blur',
  'collage of torn paper and photography, editorial graphic design',
  '3D render with iridescent materials and soft volumetric light',
  'glitch art with chromatic aberration and data streams',
  'vaporwave dreamscape with soft gradients',
];
const PALETAS = [
  'electric orange and deep navy',
  'tangerine, hot pink and violet',
  'coral red and teal',
  'black, neon orange and warm white',
  'peach, lilac and electric blue',
  'burnt orange and emerald green',
];

const azar = (lista) => lista[Math.floor(Math.random() * lista.length)];
const nada = (motivo) => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store', 'X-Fondo': motivo } });

const aBytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const imagen = (b64, motivo) => new Response(aBytes(b64), {
  headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'X-Fondo': motivo },
});

export async function fondo(request, env, waitUntil) {
  if (!env.AI || !env.CONTADOR) return nada('sin-binding');

  // 1) fuera bots y peticiones que no vengan de la propia web
  const ua = request.headers.get('User-Agent') || '';
  if (!ua || BOTS.test(ua)) return nada('bot');
  const sitio = request.headers.get('Sec-Fetch-Site');
  if (sitio && sitio !== 'same-origin') return nada('origen');

  const contador = env.CONTADOR.get(env.CONTADOR.idFromName('global'));
  const ultima = async (motivo) => {
    try { const b64 = await contador.ultima(); return b64 ? imagen(b64, motivo) : nada(motivo); }
    catch (e) { return nada(motivo); }
  };

  // 2) límite por IP: máx. 3 por minuto (rate limiter de Cloudflare)...
  const ip = request.headers.get('CF-Connecting-IP') || 'desconocida';
  if (env.LIMITE) {
    const { success } = await env.LIMITE.limit({ key: ip });
    if (!success) return ultima('limite-minuto');
  }
  // ...y máx. 6 por hora (contador en la caché de Cloudflare; solo funciona en miguelo.com, no en workers.dev)
  const clave = new Request('https://limite.miguelo.internal/bg/' + encodeURIComponent(ip));
  const cache = caches.default;
  const previo = await cache.match(clave);
  const usadas = previo ? parseInt(await previo.text(), 10) || 0 : 0;
  if (usadas >= LIMITE_POR_IP) return ultima('limite-hora');
  waitUntil(cache.put(clave, new Response(String(usadas + 1), { headers: { 'Cache-Control': 'max-age=' + VENTANA_SEG } })));

  // 3) tope de gasto diario (global, para todas las visitas): si se llega, la última imagen
  let permitido = false;
  try { permitido = await contador.reservar(TOPE_DIARIO); } catch (e) { permitido = false; }
  if (!permitido) return ultima('tope-diario');

  // 4) generar
  const prompt = `${azar(ESCENAS)}, ${azar(ESTILOS)}, color palette ${azar(PALETAS)}, `
    + 'vibrant, high contrast, atmospheric, award-winning graphic design, full-bleed background, '
    + 'no text, no letters, no words, no logos, no watermark';
  try {
    const r = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', { prompt, steps: PASOS });
    if (!r || !r.image) return ultima('vacia');
    waitUntil(contador.guardar(r.image).catch(() => {}));
    return imagen(r.image, 'nueva');
  } catch (e) {
    // filtro del modelo, cuota agotada, etc.
    return ultima('error');
  }
}
