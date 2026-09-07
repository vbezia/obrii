import {
  COOKIE,
  SESSION_SECONDS,
  checkPassword,
  makeSession,
  sameOrigin,
  limitLogin,
} from '@/lib/admin/auth';
import { errorResponse, json, readJson } from '@/lib/admin/http';
import { AdminError } from '@/lib/admin/validation';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    limitLogin(request);
    const body = (await readJson(request, 2048)) as { password?: unknown };
    if (
      !body ||
      typeof body.password !== 'string' ||
      body.password.length > 256 ||
      !(await checkPassword(body.password))
    )
      throw new AdminError('Невірний пароль.', 401);
    const response = json({ ok: true });
    response.cookies.set(COOKIE, makeSession(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_SECONDS,
    });
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const response = json({ ok: true });
    response.cookies.set(COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
