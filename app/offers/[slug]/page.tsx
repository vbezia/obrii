import { notFound } from 'next/navigation';
import { OfferDetailPage } from '@/components/site';
import { getOffer, offers } from '@/lib/content';

export function generateStaticParams() {
  return offers.map((offer) => ({ slug: offer.slug }));
}

type OfferPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: OfferPageProps) {
  const { slug } = await params;
  const offer = getOffer(slug);
  return {
    title: offer ? offer.title.ua : 'Подорож',
    description: offer?.excerpt.ua,
  };
}

export default async function Page({ params }: OfferPageProps) {
  const { slug } = await params;
  if (!getOffer(slug)) notFound();
  return <OfferDetailPage slug={slug} />;
}
