import {
  cleanContactValue,
  deliverContactMessage,
  makeContactMessage,
  type ContactRequest,
  validateContactRequest,
} from '@/lib/contact-request';

const rateBucket = new Map<string, { count: number; reset: number }>();
const delivered = new Map<string, { requestId: string; reset: number }>();

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

function requestId() {
  return `OBRII-G-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

async function digest(payload: ContactRequest) {
  const input = [
    cleanContactValue(payload.clientRequestId, 80),
    cleanContactValue(payload.contact, 120),
    cleanContactValue(payload.message, 2000),
  ].join('|');
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(input),
  );
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function limited(ip: string) {
  const now = Date.now();
  const entry = rateBucket.get(ip);
  if (!entry || entry.reset < now) {
    rateBucket.set(ip, { count: 1, reset: now + 15 * 60 * 1000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 5;
}

export async function POST(request: Request) {
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > 16_384)
    return json({ ok: false, error: 'payload_too_large' }, 413);
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'local';
  if (limited(ip)) return json({ ok: false, error: 'rate_limited' }, 429);

  let payload: ContactRequest;
  try {
    const text = await request.text();
    if (text.length > 16_384)
      return json({ ok: false, error: 'payload_too_large' }, 413);
    payload = JSON.parse(text) as ContactRequest;
  } catch {
    return json({ ok: false, error: 'bad_json' }, 400);
  }

  const errors = validateContactRequest(payload);
  if (errors.website === 'spam') return json({ ok: true });
  if (Object.keys(errors).length) return json({ ok: false, errors }, 400);

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId)
    return json({ ok: false, error: 'telegram_not_configured' }, 503);

  // Best-effort only: process-local deduplication and rate limits do not span Vercel instances.
  const key = await digest(payload);
  const prior = delivered.get(key);
  if (prior && prior.reset > Date.now())
    return json({ ok: true, deduped: true, requestId: prior.requestId });

  const id = requestId();
  const message = makeContactMessage(payload, id);
  if (message.length > 3900)
    return json({ ok: false, error: 'message_too_large' }, 400);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7500);
  try {
    const result = await deliverContactMessage(
      message,
      { token, chatId, threadId: process.env.TELEGRAM_MESSAGE_THREAD_ID },
      (input, init) => fetch(input, { ...init, signal: controller.signal }),
    );
    if (!result.ok) {
      console.error('contact_telegram_delivery_failed', {
        status: result.status,
        code: result.code,
        requestId: id,
      });
      return json({ ok: false, error: 'telegram_delivery_failed' }, 502);
    }
    delivered.set(key, {
      requestId: id,
      reset: Date.now() + 24 * 60 * 60 * 1000,
    });
    return json({ ok: true, requestId: id });
  } catch (error) {
    console.error('contact_telegram_delivery_error', {
      message:
        error instanceof Error
          ? cleanContactValue(error.message, 120)
          : 'unknown',
      requestId: id,
    });
    return json({ ok: false, error: 'telegram_network_error' }, 504);
  } finally {
    clearTimeout(timeout);
  }
}
