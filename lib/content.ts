import rawData from '@/content/site.json';
import type { Content } from '@/lib/admin/validation';
const data = rawData as unknown as Content;

export type Locale = 'ua' | 'en';
export const {
  site,
  heroPanels,
  owners,
  tripFormats,
  copy,
  workSteps,
  conciergeItems,
  conciergePage,
  aboutPage,
  contactsPage,
  formatCards,
  pages,
  seo,
  footer,
  detailNote,
} = data;
export const offers = data.offers
  .filter((offer) => offer.published)
  .sort((a, b) => a.order - b.order);
export function getOffer(slug: string) {
  return offers.find((offer) => offer.slug === slug);
}
