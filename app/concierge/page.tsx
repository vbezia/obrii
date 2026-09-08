import type { Metadata } from 'next';
import { ConciergePage } from '@/components/concierge-page';
import { conciergePage, seo } from '@/lib/content';

const canonical = `${seo.url.replace(/\/$/, '')}/concierge`;

export const metadata: Metadata = {
  title: { absolute: conciergePage.seo.title },
  description: conciergePage.seo.description,
  alternates: { canonical },
  openGraph: {
    title: conciergePage.seo.title,
    description: conciergePage.seo.description,
    url: canonical,
    images: [conciergePage.seo.image],
    locale: 'uk_UA',
    type: 'website',
  },
};

export default function Page() {
  return <ConciergePage />;
}
