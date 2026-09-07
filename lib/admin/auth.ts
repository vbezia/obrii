import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { AdminError } from './validation.ts';
const derive = promisify(scrypt);
export const COOKIE = 'obrii_admin';
export const SESSION_SECONDS = 8 * 60 * 60;
export function configured() {
  return (
    !!process.env.ADMIN_PASSWORD_HASH?.match(
      /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/,
    ) && (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32
  );
}
function secret() {
  if (!configured())
    throw new AdminError(
      'Вхід ще не налаштовано. Зверніться до розробника.',
      503,
    );
  return process.env.ADMIN_SESSION_SECRET!;
}
export async function checkPassword(password: string) {
  secret();
  const [, salt, hash] = process.env.ADMIN_PASSWORD_HASH!.split('$');
  const actual = (await derive(password, salt, 64)) as Buffer;
  return timingSafeEqual(actual, Buffer.from(hash, 'hex'));
}
export function makeSession(now = Date.now()) {
  const payload = `${Math.floor(now / 1000) + SESSION_SECONDS}.${randomBytes(16).toString('hex')}`;
  return `${payload}.${createHmac('sha256', secret()).update(payload).digest('hex')}`;
}
export function validSession(token: string | undefined, now = Date.now()) {
  if (
    !configured() ||
    !token ||
    !/^\d{10}\.[a-f0-9]{32}\.[a-f0-9]{64}$/.test(token)
  )
    return false;
  const [expiry, nonce, signature] = token.split('.');
  const expected = createHmac('sha256', secret())
    .update(`${expiry}.${nonce}`)
    .digest();
  return (
    +expiry > now / 1000 &&
    +expiry <= now / 1000 + SESSION_SECONDS &&
    timingSafeEqual(expected, Buffer.from(signature, 'hex'))
  );
}
export function sameOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    throw new AdminError('Запит з іншого сайту заборонено.', 403);
}
const attempts = new Map<string, { count: number; reset: number }>();
// Per-instance protection supplements the high-entropy admin password, not a distributed limiter.
export function limitLogin(request: Request) {
  const key =
    request.headers.get('x-vercel-forwarded-for') ||
    request.headers.get('x-forwarded-for') ||
    'unknown';
  const now = Date.now();
  for (const [k, v] of attempts) if (v.reset < now) attempts.delete(k);
  const item = attempts.get(key) ?? { count: 0, reset: now + 900000 };
  if ((attempts.size >= 1000 && !attempts.has(key)) || ++item.count > 10)
    throw new AdminError('Забагато спроб. Спробуйте через 15 хвилин.', 429);
  attempts.set(key, item);
}
