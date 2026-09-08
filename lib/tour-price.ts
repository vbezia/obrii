import type { TourPrice } from '@/lib/admin/validation';

export const priceTypeLabels = {
  from: 'Від',
  fixed: 'Фіксована',
  on_request: 'За запитом',
} as const;

export const priceBasisLabels = {
  person: 'за особу',
  two_people: 'за двох',
  group: 'за групу',
  night: 'за ніч',
  trip: 'за подорож',
} as const;

export const currencySymbols = { EUR: '€', USD: '$', UAH: '₴' } as const;

export function formatMinorAmount(amount: number) {
  const value = amount / 100;
  const fractionDigits = amount % 100 === 0 ? 0 : amount % 10 === 0 ? 1 : 2;
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatTourPrice(price: TourPrice) {
  if (price.type === 'on_request' || !price.amount) return 'Ціна за запитом';
  const prefix = price.type === 'from' ? 'Від ' : '';
  return `${prefix}${formatMinorAmount(price.amount)} ${currencySymbols[price.currency]} / ${priceBasisLabels[price.basis]}`;
}

export function formatTourPriceForTelegram(price: TourPrice) {
  if (price.type === 'on_request' || !price.amount) return 'за запитом';
  const prefix = price.type === 'from' ? 'від ' : '';
  return `${prefix}${formatMinorAmount(price.amount)} ${price.currency} / ${priceBasisLabels[price.basis]}`;
}

export function resolveOfferForInquiry<
  T extends {
    id: string;
    slug: string;
    title: { ua: string };
    price: TourPrice;
  },
>(offerId: string, offers: readonly T[]) {
  const offer = offers.find((item) => item.id === offerId);
  if (!offer) {
    return {
      found: false as const,
      text: `Пропозиція: ${offerId || '-'} · початкова пропозиція потребує уточнення`,
    };
  }
  return {
    found: true as const,
    offer,
    text: [
      `Пропозиція: ${offer.title.ua} · ${offer.id}`,
      `Формат ціни: ${priceTypeLabels[offer.price.type]}`,
      `Вартість пропозиції: ${formatTourPriceForTelegram(offer.price)}`,
      offer.price.note ? `Пояснення до ціни: ${offer.price.note}` : '',
      `Сторінка пропозиції: /offers/${offer.slug}`,
    ]
      .filter(Boolean)
      .join('\n'),
  };
}
