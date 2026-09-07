import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://obrii.travel'),
  title: {
    default: 'OBRII | Індивідуальні подорожі та concierge',
    template: '%s | OBRII',
  },
  description:
    'Преміальна українська турагенція для VIP-туризму, індивідуальних подорожей, concierge і подієвих поїздок.',
  openGraph: {
    title: 'OBRII',
    description: 'Індивідуальні подорожі, створені навколо вас.',
    images: ['/assets/hero/mountain.png'],
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
