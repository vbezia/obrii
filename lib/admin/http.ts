import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { COOKIE, validSession } from './auth';
import { AdminError } from './validation';
export const json = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
export function errorResponse(error: unknown) {
  return json(
    {
      error:
        error instanceof AdminError
          ? error.message
          : 'Не вдалося виконати дію. Спробуйте ще раз.',
    },
    error instanceof AdminError ? error.status : 500,
  );
}
export async function requireAdmin() {
  if (!validSession((await cookies()).get(COOKIE)?.value))
    throw new AdminError('Увійдіть повторно, щоб продовжити.', 401);
}
export async function readJson(
  request: Request,
  max: number,
): Promise<unknown> {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new AdminError('Очікується JSON.', 415);
  if (Number(request.headers.get('content-length')) > max)
    throw new AdminError('Завеликий запит.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new AdminError('Порожній запит.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      throw new AdminError('Завеликий запит.', 413);
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new AdminError('Некоректний JSON.');
  }
}
