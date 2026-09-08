export const contactTopics = {
  travel: 'Подорож',
  concierge: 'Консьєрж-сервіс',
  partnership: 'Співпраця',
  other: 'Інше',
} as const;

export const contactMethods = {
  telegram: 'Telegram',
  phone: 'Телефон',
  whatsapp: 'WhatsApp',
  email: 'Email',
} as const;

export type ContactRequest = {
  clientRequestId?: string;
  name?: string;
  topic?: string;
  contactMethod?: string;
  contact?: string;
  message?: string;
  consent?: boolean;
  website?: string;
  source?: Record<string, string>;
};

export function cleanContactValue(value: unknown, max = 2000) {
  return typeof value === 'string'
    ? value.trim().replace(/\r\n/g, '\n').slice(0, max)
    : '';
}

function validPhoneContact(value: string) {
  return (
    /^[+()\d\s.-]+$/.test(value) && /^\d{7,15}$/.test(value.replace(/\D/g, ''))
  );
}

function validTelegram(value: string) {
  return (
    /^@[A-Za-z0-9_]{5,32}$/.test(value) ||
    /^https:\/\/(t\.me|telegram\.me)\/[A-Za-z0-9_]{5,32}\/?$/.test(value)
  );
}

export function validateContactRequest(payload: ContactRequest) {
  const errors: Record<string, string> = {};
  const name = cleanContactValue(payload.name, 81);
  const contact = cleanContactValue(payload.contact, 121);
  const message = cleanContactValue(payload.message, 2001);
  if (payload.website) errors.website = 'spam';
  if (name.length < 2 || name.length > 80) errors.name = 'invalid';
  if (!(payload.topic && payload.topic in contactTopics))
    errors.topic = 'invalid';
  if (!(payload.contactMethod && payload.contactMethod in contactMethods))
    errors.contactMethod = 'invalid';
  if (contact.length < 3 || contact.length > 120) errors.contact = 'invalid';
  else if (
    payload.contactMethod === 'email' &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)
  )
    errors.contact = 'invalid';
  else if (
    (payload.contactMethod === 'phone' ||
      payload.contactMethod === 'whatsapp') &&
    !validPhoneContact(contact)
  )
    errors.contact = 'invalid';
  else if (payload.contactMethod === 'telegram' && !validTelegram(contact))
    errors.contact = 'invalid';
  if (message.length < 10 || message.length > 2000) errors.message = 'invalid';
  if (!payload.consent) errors.consent = 'required';
  return errors;
}

export function makeContactMessage(
  payload: ContactRequest,
  id: string,
  now = new Date(),
) {
  const source = payload.source ?? {};
  const utm = Object.entries(source)
    .filter(([key]) => /^utm_(source|medium|campaign|term|content)$/.test(key))
    .map(([key, value]) => `${key}: ${cleanContactValue(value, 100)}`)
    .join('\n');
  const topic = contactTopics[payload.topic as keyof typeof contactTopics];
  const method =
    contactMethods[payload.contactMethod as keyof typeof contactMethods];
  const time = new Intl.DateTimeFormat('uk-UA', {
    timeZone: 'Europe/Kyiv',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(now);
  return [
    'НОВЕ ЗВЕРНЕННЯ — OBRII',
    '',
    `Тема: ${topic}`,
    `Ім’я: ${cleanContactValue(payload.name, 80)}`,
    `Спосіб зв’язку: ${method}`,
    `Контакт: ${cleanContactValue(payload.contact, 120)}`,
    '',
    'Повідомлення:',
    cleanContactValue(payload.message, 2000),
    '',
    'Джерело: /contacts',
    `ID звернення: ${id}`,
    `Час надсилання: ${time} Europe/Kyiv`,
    utm ? `UTM:\n${utm}` : 'UTM: -',
  ].join('\n');
}

export async function deliverContactMessage(
  message: string,
  config: { token: string; chatId: string; threadId?: string },
  fetcher: typeof fetch = fetch,
) {
  const response = await fetcher(
    `https://api.telegram.org/bot${config.token}/sendMessage`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        message_thread_id: config.threadId
          ? Number(config.threadId)
          : undefined,
        disable_web_page_preview: true,
        text: message,
      }),
    },
  );
  const result = (await response.json().catch(() => null)) as {
    ok?: boolean;
    error_code?: number;
  } | null;
  return {
    ok: response.ok && result?.ok === true,
    status: response.status,
    code: result?.error_code,
  };
}
