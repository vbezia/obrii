import defaults from '../../content/schema.json' with { type: 'json' };

export type Content = typeof defaults;
export type Media = { path: string; content: string };
export class AdminError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
function fail(path: string): never {
  throw new AdminError(`Перевірте поле: ${path}`);
}
export function validImage(value: string): boolean {
  if (/^\/assets\/[a-zA-Z0-9/_-]+\.(png|jpg|jpeg|webp)$/i.test(value))
    return true;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password;
  } catch {
    return false;
  }
}
export function validateContent(input: unknown): Content {
  function shape(value: unknown, sample: unknown, path: string): void {
    if (Array.isArray(sample)) {
      if (!Array.isArray(value) || value.length > 100) return fail(path);
      for (const [i, item] of value.entries())
        shape(item, sample[0], `${path}.${i}`);
    } else if (sample && typeof sample === 'object') {
      if (!value || typeof value !== 'object' || Array.isArray(value))
        return fail(path);
      const target = value as Record<string, unknown>;
      if (Object.keys(target).length !== Object.keys(sample).length)
        return fail(path);
      for (const [key, item] of Object.entries(sample))
        shape(target[key], item, `${path}.${key}`);
    } else if (
      typeof value !== typeof sample ||
      (typeof value === 'string' && value.length > 20000) ||
      (typeof value === 'number' &&
        (!Number.isFinite(value) || value < 0 || value > 10000))
    )
      fail(path);
  }
  shape(input, defaults, 'content');
  const data = input as Content;
  if (JSON.stringify(data).length > 750000) fail('content: забагато тексту');
  if (
    data.heroPanels.length !== 3 ||
    new Set(data.heroPanels.map((p) => p.id)).size !== 3
  )
    fail('heroPanels');
  if (data.owners.length < 1 || data.owners.length > 10) fail('owners');
  const image = (value: string) => {
    if (!validImage(value))
      fail('зображення: потрібен HTTPS URL або /assets/…');
  };
  data.heroPanels.forEach((p) => {
    if (!['beach', 'mountain', 'events'].includes(p.id)) fail('heroPanels.id');
    image(p.image);
  });
  data.owners.forEach((o) => {
    image(o.image);
    image(o.holidayImage);
    for (const pos of [o.imagePosition, o.holidayImagePosition])
      if (!/^(100|\d{1,2})% (100|\d{1,2})%$/.test(pos))
        fail('позиція фото: наприклад 50% 50%');
    if (!o.name.ua.trim()) fail('ім’я співвласника');
  });
  const slugs = new Set<string>(),
    ids = new Set<string>();
  data.offers.forEach((o) => {
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(o.slug) ||
      o.slug.length > 120 ||
      slugs.has(o.slug)
    )
      fail('унікальний URL туру');
    if (!o.id.trim() || ids.has(o.id)) fail('унікальний ID туру');
    if (!o.title.ua.trim() || !o.destination.ua.trim())
      fail('назва та напрямок туру');
    slugs.add(o.slug);
    ids.add(o.id);
    image(o.image);
  });
  for (const locale of ['ua', 'en'] as const) {
    if (data.copy[locale].nav.length !== 5) fail('навігація');
    for (const pair of [...data.workSteps[locale], ...data.formatCards[locale]])
      if (pair.length !== 2) fail('заголовок та опис блоку');
  }
  if (
    !data.site.name.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.site.email)
  )
    fail('контакти');
  if (!/^@[A-Za-z0-9_]{5,32}$/.test(data.site.telegram))
    fail('Telegram: @username');
  try {
    const u = new URL(data.seo.url);
    if (
      u.protocol !== 'https:' ||
      u.username ||
      u.password ||
      u.pathname !== '/' ||
      u.search ||
      u.hash
    )
      fail('SEO URL');
  } catch {
    fail('SEO URL');
  }
  image(data.seo.image);
  return data;
}
export function validateMedia(input: unknown): Media[] {
  if (!Array.isArray(input) || input.length > 10) fail('файли');
  let total = 0;
  const paths = new Set<string>();
  for (const item of input) {
    if (
      !item ||
      typeof item.path !== 'string' ||
      !/^public\/assets\/uploads\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(
        item.path,
      ) ||
      paths.has(item.path)
    )
      fail('шлях файлу');
    paths.add(item.path);
    if (
      typeof item.content !== 'string' ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(item.content)
    )
      fail('файл');
    const b = Buffer.from(item.content, 'base64');
    total += b.length;
    if (b.length > 2 * 1024 * 1024 || total > 3 * 1024 * 1024)
      fail('фото: до 2 МБ кожне, до 3 МБ за публікацію');
    const jpg = b[0] === 255 && b[1] === 216 && b[2] === 255;
    const png = b
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const webp =
      b.toString('ascii', 0, 4) === 'RIFF' &&
      b.toString('ascii', 8, 12) === 'WEBP';
    if (
      !(
        (item.path.endsWith('.jpg') && jpg) ||
        (item.path.endsWith('.png') && png) ||
        (item.path.endsWith('.webp') && webp)
      )
    )
      fail('формат фото: JPG, PNG або WebP');
  }
  return input as Media[];
}
