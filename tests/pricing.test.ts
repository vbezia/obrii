import test from 'node:test';
import assert from 'node:assert/strict';
import defaults from '../content/site.json' with { type: 'json' };
import {
  validateContent,
  type Content,
  type TourPrice,
} from '../lib/admin/validation.ts';
import {
  formatTourPrice,
  formatTourPriceForTelegram,
  resolveOfferForInquiry,
} from '../lib/tour-price.ts';

function normalized(value: string) {
  return value.replace(/[\s\u00a0\u202f]+/g, ' ');
}

await test('all existing tours have valid configured USD prices', () => {
  const content = validateContent(structuredClone(defaults));
  assert.equal(content.offers.length, 8);
  assert.ok(content.offers.every((offer) => offer.price.currency === 'USD'));
  assert.ok(
    content.offers.every(
      (offer) =>
        offer.price.type !== 'on_request' &&
        Number.isSafeInteger(offer.price.amount) &&
        Number(offer.price.amount) > 0,
    ),
  );
});

await test('legacy tours without price migrate to an on-request price', () => {
  const legacy = structuredClone(defaults) as unknown as Record<
    string,
    unknown
  >;
  const offers = legacy.offers as Array<Record<string, unknown>>;
  delete offers[0].price;
  const content = validateContent(legacy);
  assert.deepEqual(content.offers[0].price, {
    type: 'on_request',
    amount: null,
    currency: 'EUR',
    basis: 'trip',
    note: '',
  });
  assert.equal('price' in offers[0], false);
});

await test('price formatter supports types, currencies, bases and meaningful decimals', () => {
  const cases: Array<[TourPrice, RegExp]> = [
    [
      {
        type: 'from',
        amount: 350000,
        currency: 'EUR',
        basis: 'person',
        note: '',
      },
      /Від 3 500 € \/ за особу/,
    ],
    [
      {
        type: 'fixed',
        amount: 700000,
        currency: 'USD',
        basis: 'two_people',
        note: '',
      },
      /7 000 \$ \/ за двох/,
    ],
    [
      {
        type: 'fixed',
        amount: 250050,
        currency: 'UAH',
        basis: 'group',
        note: '',
      },
      /2 500,5 ₴ \/ за групу/,
    ],
    [
      {
        type: 'from',
        amount: 99999,
        currency: 'EUR',
        basis: 'night',
        note: '',
      },
      /999,99 € \/ за ніч/,
    ],
    [
      {
        type: 'fixed',
        amount: 10000,
        currency: 'EUR',
        basis: 'trip',
        note: '',
      },
      /100 € \/ за подорож/,
    ],
  ];
  for (const [price, expected] of cases)
    assert.match(normalized(formatTourPrice(price)), expected);
  assert.equal(
    formatTourPrice({
      type: 'on_request',
      amount: null,
      currency: 'EUR',
      basis: 'trip',
      note: '',
    }),
    'Ціна за запитом',
  );
});

await test('content validation rejects malformed and unsupported prices', () => {
  const valid = structuredClone(defaults) as unknown as Content;
  valid.offers[0].price = {
    type: 'from',
    amount: 350000,
    currency: 'EUR',
    basis: 'person',
    note: 'За особу',
  };
  assert.doesNotThrow(() => validateContent(valid));
  for (const amount of [0, -1, 1.5, Number.POSITIVE_INFINITY]) {
    const bad = structuredClone(valid);
    bad.offers[0].price.amount = amount;
    assert.throws(() => validateContent(bad));
  }
  const badType = structuredClone(valid);
  badType.offers[0].price.type = 'discount' as TourPrice['type'];
  assert.throws(() => validateContent(badType));
  const requestWithAmount = structuredClone(valid);
  requestWithAmount.offers[0].price.type = 'on_request';
  assert.throws(() => validateContent(requestWithAmount));
});

await test('inquiry pricing is resolved from server offer data, not browser values', () => {
  const offer = {
    id: 'OBRII-TEST',
    slug: 'server-offer',
    title: { ua: 'Серверна пропозиція' },
    price: {
      type: 'from',
      amount: 350000,
      currency: 'EUR',
      basis: 'person',
      note: 'За умови розміщення',
    } as TourPrice,
  };
  const resolved = resolveOfferForInquiry('OBRII-TEST', [offer]);
  assert.equal(resolved.found, true);
  assert.match(
    normalized(resolved.text),
    /Вартість пропозиції: від 3 500 EUR \/ за особу/,
  );
  assert.doesNotMatch(resolved.text, /999 USD/);
  assert.match(resolved.text, /Пояснення до ціни: За умови розміщення/);
  assert.equal(
    formatTourPriceForTelegram({
      ...offer.price,
      type: 'on_request',
      amount: null,
    }),
    'за запитом',
  );
  assert.equal(resolveOfferForInquiry('REMOVED', [offer]).found, false);
});
