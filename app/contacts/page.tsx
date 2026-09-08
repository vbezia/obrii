import type { Metadata } from 'next';
import { ContactsPage } from '@/components/contacts-page';
import { contactsPage, seo } from '@/lib/content';

const canonical = `${seo.url.replace(/\/$/, '')}/contacts`;
export const metadata: Metadata = {
  title: { absolute: contactsPage.seo.title },
  description: contactsPage.seo.description,
  alternates: { canonical },
  openGraph: {
    title: contactsPage.seo.title,
    description: contactsPage.seo.description,
    url: canonical,
    images: [contactsPage.seo.image],
    locale: 'uk_UA',
    type: 'website',
  },
};

export default function Page() {
  return <ContactsPage />;
}
