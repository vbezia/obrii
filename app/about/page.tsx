import type { Metadata } from 'next';
import { AboutPage } from '@/components/about-page';
import { aboutPage, seo } from '@/lib/content';

const canonical = `${seo.url.replace(/\/$/, '')}/about`;
export const metadata: Metadata = {
  title: { absolute: aboutPage.seo.title },
  description: aboutPage.seo.description,
  alternates: { canonical },
  openGraph: {
    title: aboutPage.seo.title,
    description: aboutPage.seo.description,
    url: canonical,
    images: [aboutPage.seo.image],
    locale: 'uk_UA',
    type: 'website',
  },
};

export default function Page() {
  return <AboutPage />;
}
