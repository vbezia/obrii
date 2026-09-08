import test from 'node:test';
import assert from 'node:assert/strict';
import { configuredContacts } from '../lib/contact-links.ts';
import {
  deliverContactMessage,
  makeContactMessage,
  validateContactRequest,
} from '../lib/contact-request.ts';

const valid = {
  clientRequestId: 'client-1',
  name: 'Олена',
  topic: 'travel',
  contactMethod: 'telegram',
  contact: '@olena_test',
  message: 'Хочу обговорити подорож до Італії.',
  consent: true,
};

await test('general contact validation accepts valid data and rejects invalid stable IDs', () => {
  assert.deepEqual(validateContactRequest(valid), {});
  const errors = validateContactRequest({
    ...valid,
    topic: 'forged',
    contactMethod: 'unknown',
  });
  assert.equal(errors.topic, 'invalid');
  assert.equal(errors.contactMethod, 'invalid');
});

await test('contact validation adapts to email, phone and Telegram values', () => {
  assert.deepEqual(
    validateContactRequest({
      ...valid,
      contactMethod: 'email',
      contact: 'hello@example.com',
    }),
    {},
  );
  assert.deepEqual(
    validateContactRequest({
      ...valid,
      contactMethod: 'phone',
      contact: '+380 67 123 45 67',
    }),
    {},
  );
  assert.equal(
    validateContactRequest({
      ...valid,
      contactMethod: 'telegram',
      contact: 'short',
    }).contact,
    'invalid',
  );
  assert.equal(
    validateContactRequest({ ...valid, message: 'short' }).message,
    'invalid',
  );
  assert.equal(
    validateContactRequest({ ...valid, consent: false }).consent,
    'required',
  );
});

await test('Telegram message uses resolved labels and keeps submitted contact details', () => {
  const message = makeContactMessage(
    valid,
    'OBRII-G-TEST',
    new Date('2026-09-08T10:00:00Z'),
  );
  assert.match(message, /НОВЕ ЗВЕРНЕННЯ — OBRII/);
  assert.match(message, /Тема: Подорож/);
  assert.match(message, /Контакт: @olena_test/);
  assert.match(message, /ID звернення: OBRII-G-TEST/);
  assert.ok(message.length < 3900);
});

await test('configured contacts hide placeholders and retain valid links', () => {
  const links = configuredContacts({
    phone: '+38 000 000 00 00',
    whatsapp: '',
    telegram: '@obrii_travel',
    email: 'hello@obrii.travel',
  });
  assert.deepEqual(
    links.map((link) => link.id),
    ['telegram', 'email'],
  );
  assert.equal(links[0].href, 'https://t.me/obrii_travel');
  assert.deepEqual(
    configuredContacts({ phone: '', whatsapp: '', telegram: '', email: '' }),
    [],
  );
});

await test('delivery reports mocked Telegram success and failure', async () => {
  const success = await deliverContactMessage(
    'test',
    { token: 'fake', chatId: '1' },
    async () => Response.json({ ok: true }),
  );
  assert.equal(success.ok, true);
  const failure = await deliverContactMessage(
    'test',
    { token: 'fake', chatId: '1' },
    async () => Response.json({ ok: false, error_code: 400 }, { status: 400 }),
  );
  assert.deepEqual(failure, { ok: false, status: 400, code: 400 });
});
