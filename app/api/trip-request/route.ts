type TripRequest = Record<string, unknown> & {
  clientRequestId?: string;
  name?: string;
  contactMethod?: string;
  contact?: string;
  destination?: string;
  undecided?: boolean;
  formats?: string[];
  startDate?: string;
  endDate?: string;
  month?: string;
  flexibleDates?: boolean;
  adults?: number;
  children?: number;
  childAges?: string[];
  departure?: string;
  budget?: string;
  currency?: string;
  budgetType?: string;
  needBudgetAdvice?: boolean;
  wishes?: string;
  otherContacts?: string;
  contactTime?: string;
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
const delivered = new Map<string, { reset: number; result?: unknown }>();
const windowMs = 15 * 60 * 1000;
const maxRequests = 5;

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

function escapeHtml(value: unknown) {
  return clean(value, 900)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

async function hashPayload(payload: TripRequest) {
  const text = JSON.stringify({
    id: payload.clientRequestId,
    name: payload.name,
    contact: payload.contact,
    destination: payload.destination,
    offer: payload.source?.offerId,
  });
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
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
  return `OBRII-${stamp}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function validate(payload: TripRequest) {
  const errors: Record<string, string> = {};
  if (payload.website) errors.website = 'spam';
  if (!payload.consent) errors.consent = 'required';
  if (clean(payload.name, 80).length < 2) errors.name = 'required';
  if (clean(payload.contact, 120).length < 3) errors.contact = 'required';
  if (!payload.undecided && clean(payload.destination, 160).length < 2) {
    errors.destination = 'required';
  }
  if (!Array.isArray(payload.formats) || payload.formats.length === 0) {
    errors.formats = 'required';
  }
  if (
    !payload.flexibleDates &&
    !payload.month &&
    (!payload.startDate || !payload.endDate)
  ) {
    errors.dates = 'required';
  }
  if (!payload.needBudgetAdvice && Number(payload.budget) <= 0) {
    errors.budget = 'required';
  }
  if (
    Number(payload.children) > 0 &&
    (!Array.isArray(payload.childAges) ||
      payload.childAges.length < Number(payload.children) ||
      payload.childAges.some((age) => !clean(age, 20)))
  ) {
    errors.childAges = 'required';
  }
  return errors;
}

function makeMessage(payload: TripRequest, id: string) {
  const kyivTime = new Intl.DateTimeFormat('uk-UA', {
    timeZone: 'Europe/Kyiv',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());
  const dates = payload.flexibleDates
    ? 'Дати гнучкі'
    : clean(payload.month) || `${clean(payload.startDate)} - ${clean(payload.endDate)}`;
  const travelers = `${Number(payload.adults || 1)} дорослих, ${Number(payload.children || 0)} дітей${
    Number(payload.children || 0) > 0
      ? ` (${(payload.childAges ?? []).map((age) => clean(age, 20)).join(', ')})`
      : ''
  }`;
  const budget = payload.needBudgetAdvice
    ? 'Потрібна рекомендація щодо бюджету'
    : `${clean(payload.budget, 40)} ${clean(payload.currency, 4)} · ${
        payload.budgetType === 'person' ? 'на одну особу' : 'на всю подорож'
      }`;
  const source = payload.source ?? {};
  const utm = Object.entries(source)
    .filter(([key]) => key.startsWith('utm_'))
    .map(([key, value]) => `${key}: ${clean(value, 100)}`)
    .join('\n');

  return [
    '<b>Нова заявка OBRII</b>',
    `<b>Номер:</b> ${escapeHtml(id)}`,
    `<b>Дата:</b> ${escapeHtml(kyivTime)} Europe/Kyiv`,
    '',
    `<b>Ім’я:</b> ${escapeHtml(payload.name)}`,
    `<b>Зв’язок:</b> ${escapeHtml(payload.contactMethod)} · ${escapeHtml(payload.contact)}`,
    `<b>Інші контакти:</b> ${escapeHtml(payload.otherContacts) || '-'}`,
    `<b>Зручний час:</b> ${escapeHtml(payload.contactTime) || '-'}`,
    '',
    `<b>Напрям:</b> ${payload.undecided ? 'Ще не визначилися' : escapeHtml(payload.destination)}`,
    `<b>Формати:</b> ${escapeHtml((payload.formats ?? []).join(', '))}`,
    `<b>Дати:</b> ${escapeHtml(dates)}`,
    `<b>Туристи:</b> ${escapeHtml(travelers)}`,
    `<b>Відправлення:</b> ${escapeHtml(payload.departure) || '-'}`,
    `<b>Бюджет:</b> ${escapeHtml(budget)}`,
    `<b>Побажання:</b> ${escapeHtml(payload.wishes) || '-'}`,
    '',
    source.offerId
      ? `<b>Пропозиція:</b> ${escapeHtml(source.offerTitle)} · ${escapeHtml(source.offerId)}\n${escapeHtml(source.offerUrl)}`
      : '<b>Пропозиція:</b> -',
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

  let payload: TripRequest;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'bad_json' }, 400);
  }

  const errors = validate(payload);
  if (Object.keys(errors).length > 0) {
    return json({ ok: false, errors }, 400);
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const threadId = process.env.TELEGRAM_MESSAGE_THREAD_ID;
  if (!token || !chatId) {
    return json({ ok: false, error: 'telegram_not_configured' }, 503);
  }

  const dedupeKey = await hashPayload(payload);
  const existing = delivered.get(dedupeKey);
  if (existing && existing.reset > Date.now()) {
    return json({ ok: true, deduped: true, result: existing.result });
  }

  const id = requestId();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7500);
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
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
    });
    const telegramResult = (await response.json().catch(() => null)) as TelegramResponse;
    if (!response.ok || !telegramResult?.ok) {
      console.error('telegram_delivery_failed', {
        status: response.status,
        code: telegramResult?.error_code,
        description: clean(telegramResult?.description, 180),
        requestId: id,
      });
      return json({ ok: false, error: 'telegram_delivery_failed' }, 502);
    }
    delivered.set(dedupeKey, {
      reset: Date.now() + 24 * 60 * 60 * 1000,
      result: { requestId: id },
    });
    return json({ ok: true, requestId: id });
  } catch (error) {
    console.error('telegram_delivery_error', {
      message: error instanceof Error ? clean(error.message, 120) : 'unknown',
      requestId: id,
    });
    return json({ ok: false, error: 'telegram_network_error' }, 504);
  } finally {
    clearTimeout(timeout);
  }
}
