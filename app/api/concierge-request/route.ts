import { conciergePage } from '@/lib/content';

type ConciergeRequest = {
  clientRequestId?: string;
  serviceIds?: string[];
  location?: string;
  period?: string;
  guests?: string;
  budget?: string;
  wishes?: string;
  name?: string;
  contactMethod?: string;
  contact?: string;
  consent?: boolean;
  website?: string;
  source?: Record<string, string>;
};

type TelegramResponse = {
  ok?: boolean;
  error_code?: number;
  description?: string;
} | null;

const rateBucket = new Map<string, { count: number; reset: number }>();
const delivered = new Map<string, { reset: number; requestId: string }>();
const windowMs = 15 * 60 * 1000;
const maxRequests = 5;
const allowedMethods = new Set(['telegram', 'phone', 'whatsapp', 'email']);
const serviceNames = new Map(
  conciergePage.services.items
    .filter((service) => service.visible)
    .map((service) => [service.id, service.title.ua]),
);
serviceNames.set('other', 'Інше');

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

function clean(value: unknown, max = 600) {
  if (
    typeof value !== 'string' &&
    typeof value !== 'number' &&
    typeof value !== 'boolean'
  ) {
    return '';
  }
  return String(value).replace(/\s+/g, ' ').trim().slice(0, max);
}

function escapeHtml(value: unknown, max = 900) {
  return clean(value, max)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function requestId() {
  const stamp = new Intl.DateTimeFormat('uk-UA', {
    timeZone: 'Europe/Kyiv',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(new Date())
    .replace(/[^\d]/g, '')
    .slice(0, 12);
  return `OBRII-C-${stamp}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

async function hashPayload(payload: ConciergeRequest) {
  const text = JSON.stringify({
    clientRequestId: clean(payload.clientRequestId, 80),
    contact: clean(payload.contact, 120),
    wishes: clean(payload.wishes, 300),
  });
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function validate(payload: ConciergeRequest) {
  const errors: Record<string, string> = {};
  const ids = Array.isArray(payload.serviceIds) ? payload.serviceIds : [];
  if (payload.website) errors.website = 'spam';
  if (!payload.consent) errors.consent = 'required';
  if (
    !ids.length ||
    ids.length > 7 ||
    ids.some((id) => !serviceNames.has(id))
  ) {
    errors.serviceIds = 'required';
  }
  if (clean(payload.wishes, 1600).length < 10) errors.wishes = 'required';
  if (clean(payload.name, 80).length < 2) errors.name = 'required';
  if (!allowedMethods.has(clean(payload.contactMethod, 20))) {
    errors.contactMethod = 'required';
  }
  if (clean(payload.contact, 120).length < 3) errors.contact = 'required';
  if (payload.guests) {
    const guests = Number(payload.guests);
    if (!Number.isInteger(guests) || guests < 1 || guests > 100) {
      errors.guests = 'invalid';
    }
  }
  return errors;
}

function makeMessage(payload: ConciergeRequest, id: string) {
  const kyivTime = new Intl.DateTimeFormat('uk-UA', {
    timeZone: 'Europe/Kyiv',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());
  const services = (payload.serviceIds ?? [])
    .map((serviceId) => serviceNames.get(serviceId))
    .filter(Boolean)
    .join(', ');
  const source = payload.source ?? {};
  const utm = Object.entries(source)
    .filter(([key]) => key.startsWith('utm_'))
    .map(([key, value]) => `${key}: ${clean(value, 100)}`)
    .join('\n');
  const methodNames: Record<string, string> = {
    telegram: 'Telegram',
    phone: 'Телефон',
    whatsapp: 'WhatsApp',
    email: 'Email',
  };

  return [
    '<b>НОВИЙ КОНСЬЄРЖ-ЗАПИТ — OBRII</b>',
    '',
    `<b>Послуги:</b> ${escapeHtml(services)}`,
    `<b>Місце:</b> ${escapeHtml(payload.location) || '-'}`,
    `<b>Дата / період:</b> ${escapeHtml(payload.period) || '-'}`,
    `<b>Кількість гостей:</b> ${escapeHtml(payload.guests) || '-'}`,
    `<b>Орієнтовний бюджет:</b> ${escapeHtml(payload.budget) || '-'}`,
    '',
    `<b>Побажання:</b>\n${escapeHtml(payload.wishes, 1600)}`,
    '',
    `<b>Ім’я:</b> ${escapeHtml(payload.name)}`,
    `<b>Спосіб зв’язку:</b> ${escapeHtml(methodNames[clean(payload.contactMethod, 20)] || payload.contactMethod)}`,
    `<b>Контакт:</b> ${escapeHtml(payload.contact)}`,
    '',
    '<b>Джерело:</b> /concierge',
    `<b>ID запиту:</b> ${escapeHtml(id)}`,
    `<b>Час надсилання:</b> ${escapeHtml(kyivTime)} Europe/Kyiv`,
    `<b>Сторінка:</b> ${escapeHtml(source.page) || '-'}`,
    utm ? `<b>UTM:</b>\n${escapeHtml(utm)}` : '<b>UTM:</b> -',
  ]
    .join('\n')
    .slice(0, 3900);
}

function limited(ip: string) {
  const now = Date.now();
  const current = rateBucket.get(ip);
  if (!current || current.reset < now) {
    rateBucket.set(ip, { count: 1, reset: now + windowMs });
    return false;
  }
  current.count += 1;
  return current.count > maxRequests;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0] ??
    'local';
  if (limited(ip)) return json({ ok: false, error: 'rate_limited' }, 429);

  let payload: ConciergeRequest;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'bad_json' }, 400);
  }

  const errors = validate(payload);
  if (Object.keys(errors).length) return json({ ok: false, errors }, 400);

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const threadId = process.env.TELEGRAM_MESSAGE_THREAD_ID;
  if (!token || !chatId) {
    return json({ ok: false, error: 'telegram_not_configured' }, 503);
  }

  const dedupeKey = await hashPayload(payload);
  const existing = delivered.get(dedupeKey);
  if (existing && existing.reset > Date.now()) {
    return json({ ok: true, deduped: true, requestId: existing.requestId });
  }

  const id = requestId();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7500);
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_thread_id: threadId ? Number(threadId) : undefined,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          text: makeMessage(payload, id),
        }),
      },
    );
    const telegramResult = (await response
      .json()
      .catch(() => null)) as TelegramResponse;
    if (!response.ok || !telegramResult?.ok) {
      console.error('concierge_telegram_delivery_failed', {
        status: response.status,
        code: telegramResult?.error_code,
        description: clean(telegramResult?.description, 180),
        requestId: id,
      });
      return json({ ok: false, error: 'telegram_delivery_failed' }, 502);
    }
    delivered.set(dedupeKey, {
      reset: Date.now() + 24 * 60 * 60 * 1000,
      requestId: id,
    });
    return json({ ok: true, requestId: id });
  } catch (error) {
    console.error('concierge_telegram_delivery_error', {
      message: error instanceof Error ? clean(error.message, 120) : 'unknown',
      requestId: id,
    });
    return json({ ok: false, error: 'telegram_network_error' }, 504);
  } finally {
    clearTimeout(timeout);
  }
}
