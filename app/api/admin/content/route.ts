import { sameOrigin } from '@/lib/admin/auth';
import { readContent, publishContent } from '@/lib/admin/github';
import { errorResponse, json, readJson, requireAdmin } from '@/lib/admin/http';
import {
  AdminError,
  validateContent,
  validateMedia,
} from '@/lib/admin/validation';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function GET() {
  try {
    await requireAdmin();
    return json(await readContent());
  } catch (error) {
    return errorResponse(error);
  }
}
export async function PUT(request: Request) {
  try {
    sameOrigin(request);
    await requireAdmin();
    const body = (await readJson(request, 4400000)) as {
      content?: unknown;
      media?: unknown;
      version?: unknown;
    };
    if (
      !body ||
      typeof body.version !== 'string' ||
      !/^[a-f0-9]{40}$/.test(body.version)
    )
      throw new AdminError('Некоректна версія.');
    const content = validateContent(body.content),
      media = validateMedia(body.media);
    return json(await publishContent(content, media, body.version));
  } catch (error) {
    return errorResponse(error);
  }
}
