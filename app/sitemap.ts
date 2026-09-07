import type { MetadataRoute } from 'next';
import { offers } from '@/lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://obrii.travel';
  return [
    '',
    '/offers',
    '/plan-your-trip',
    '/individual-travel',
    '/concierge',
    '/about',
    '/contacts',
    '/privacy',
    '/cookies',
    '/terms',
    ...offers.map((offer) => `/offers/${offer.slug}`),
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date('2026-09-07'),
  }));
}
