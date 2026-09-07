import type { Metadata } from 'next';
import './globals.css';
import { seo } from '@/lib/content';

export const metadata: Metadata = {
  metadataBase: new URL(seo.url),
  title: { default: seo.title, template: '%s | OBRII' },
  description: seo.description,
  openGraph: {
    title: seo.title,
    description: seo.description,
    images: [seo.image],
    locale: 'uk_UA',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
