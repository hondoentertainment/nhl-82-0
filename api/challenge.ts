export const config = { runtime: 'edge' };

const CODE_RE = /^[A-Z0-9]{4,10}$/;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

/**
 * Crawler-facing landing page for a shared challenge code. Link unfurlers read
 * the per-code preview here; browsers bounce into the app, where `?c=` starts
 * the run.
 */
export default function handler(req: Request): Response {
  const url = new URL(req.url);
  const raw = (url.searchParams.get('c') ?? '').toUpperCase();

  if (!CODE_RE.test(raw)) {
    return Response.redirect(new URL('/', url.origin), 302);
  }

  const code = escapeHtml(raw);
  const target = `/?c=${encodeURIComponent(raw)}`;
  const image = `${url.origin}/api/og?c=${encodeURIComponent(raw)}`;
  const title = `82-0 challenge ${code} — same spins, no skips`;
  const description = `Take on challenge ${code}. Everyone with this code drafts from identical spins. Can you build the better six?`;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="82-0" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url.origin}/c/${code}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <link rel="canonical" href="${url.origin}/c/${code}" />
    <noscript><meta http-equiv="refresh" content="0; url=${target}" /></noscript>
    <script>window.location.replace(${JSON.stringify(target)});</script>
  </head>
  <body style="margin:0;background:#041018;color:#f4fbff;font-family:system-ui,sans-serif">
    <p style="padding:2rem">Opening challenge ${code}… <a style="color:#e8c97a" href="${target}">Continue</a></p>
  </body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=86400',
    },
  });
}
