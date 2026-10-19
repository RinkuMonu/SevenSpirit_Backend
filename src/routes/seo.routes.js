import { Router } from 'express';
import Astrologer from '../models/Astrologer.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/index.js';

const router = Router();
const STATIC = ['', '/astrologers', '/services', '/about', '/contact', '/faq'];

router.get('/sitemap.xml', asyncHandler(async (req, res) => {
  const astrologers = await Astrologer.find({ isActive: true }).select('slug updatedAt').lean();
  const urls = [
    ...STATIC.map((p) => `<url><loc>${env.siteUrl}${p}</loc><changefreq>weekly</changefreq></url>`),
    ...astrologers.map((a) =>
      `<url><loc>${env.siteUrl}/astrologer/${a.slug}</loc><lastmod>${a.updatedAt.toISOString()}</lastmod><changefreq>daily</changefreq></url>`),
  ];
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`
  );
}));

router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /chat/\nDisallow: /call/\nDisallow: /my-consultations\nSitemap: ${env.siteUrl}/sitemap.xml\n`);
});

export default router;
