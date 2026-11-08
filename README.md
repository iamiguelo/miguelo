# miguelo.com

Web de miguelo.com: la tarjeta de visita de miguelo como protagonista, en móvil y ordenador. En la cara roja se reproduce el vídeo del logo montándose; al tocarla o hacer clic gira y enseña el contacto (email y WhatsApp) y un botón para guardar el contacto.

Es una web estática servida por un Worker de Cloudflare (static assets) desde la rama `main`. La configuración está en `wrangler.jsonc`.

- `index.html`: la página
- `video/miguelo-tarjeta.mp4`: vídeo del logo para la tarjeta (y `miguelo-tarjeta-final.jpg`, su último fotograma, que se ve si el vídeo no se reproduce)
- `video/miguelo-blanco-16x9.mp4` y `video/miguelo-blanco-9x16.mp4`: vídeos originales a pantalla completa (ya no los usa la página)
- `miguelo.vcf`: contacto para guardar en la agenda
- `assets/`: logos

## Fondo con IA (`worker/bg.js`)

En cada visita la página pide `/bg`; el Worker genera al momento una imagen con FLUX schnell (Workers AI) y la pone de fondo, difuminada. Solo se guarda la última imagen buena (Durable Object `Contador`), que se enseña si se llega a un límite o falla algo. Si no hay ninguna, se queda el fondo crema.

- Los bindings (`AI` y el limitador `LIMITE`) están en `wrangler.jsonc`.
- Protecciones: fuera bots y peticiones de otras webs, máximo 3 imágenes por IP y minuto y 6 por hora, y `/bg` bloqueado en `robots.txt`.
- Gasto 0 €: tope global de 120 imágenes al día (~6.900 de las 10.000 neuronas gratis diarias de Workers AI). Al llegar, todas las visitas ven la última imagen hasta las 00:00 UTC (01:00 en invierno en España).
