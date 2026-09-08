import {
  formatMinorAmount,
  priceBasisLabels,
  currencySymbols,
} from '@/lib/tour-price';
import type { TourPrice } from '@/lib/admin/validation';

export function TourPriceDisplay({
  price,
  className = '',
}: {
  price: TourPrice;
  className?: string;
}) {
  if (price.type === 'on_request' || !price.amount) {
    return (
      <p className={`tour-price tour-price-request ${className}`.trim()}>
        Ціна за запитом
      </p>
    );
  }
  return (
    <p className={`tour-price ${className}`.trim()}>
      {price.type === 'from' && <span>Від</span>}
      <strong>
        {formatMinorAmount(price.amount)} {currencySymbols[price.currency]}
      </strong>
      <small>/ {priceBasisLabels[price.basis]}</small>
    </p>
  );
}
