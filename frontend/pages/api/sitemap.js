/**
 * Генерирует sitemap.xml для поисковых систем.
 * Базовый URL: NEXT_PUBLIC_SITE_URL или текущий host при запросе.
 */
function buildSitemapXml(urls) {
  const urlsXml = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}${u.changefreq ? `\n    <changefreq>${u.changefreq}</changefreq>` : ''}${u.priority != null ? `\n    <priority>${u.priority}</priority>` : ''}
  </url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;
}

export default function handler(req, res) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (req.headers.host ? `https://${req.headers.host}` : 'https://example.com');
  const base = baseUrl.replace(/\/$/, '');

  const now = new Date().toISOString().slice(0, 10);

  const urls = [
    { loc: base + '/', lastmod: now, changefreq: 'weekly', priority: '1.0' },
    { loc: base + '/about', lastmod: now, changefreq: 'monthly', priority: '0.8' },
    { loc: base + '/services/individuals', lastmod: now, changefreq: 'monthly', priority: '0.8' },
    { loc: base + '/services/business', lastmod: now, changefreq: 'monthly', priority: '0.8' },
    { loc: base + '/news', lastmod: now, changefreq: 'weekly', priority: '0.7' },
    { loc: base + '/reviews', lastmod: now, changefreq: 'weekly', priority: '0.7' },
    { loc: base + '/contacts', lastmod: now, changefreq: 'monthly', priority: '0.8' },
    { loc: base + '/auth/login', lastmod: now, changefreq: 'monthly', priority: '0.4' },
    { loc: base + '/auth/register', lastmod: now, changefreq: 'monthly', priority: '0.4' },
  ];

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.status(200).send(buildSitemapXml(urls));
}
