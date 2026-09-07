import { notFound } from 'next/navigation';
import { OfferDetailPage } from '@/components/site';
import { getOffer, offers } from '@/lib/content';

export function generateStaticParams() {
  return offers.map((offer) => ({ slug: offer.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const offer = getOffer(params.slug);
  return {
    title: offer ? offer.title.ua : 'Подорож',
    description: offer?.excerpt.ua,
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  if (!getOffer(params.slug)) notFound();
  return <OfferDetailPage slug={params.slug} />;
}
