'use client';
/* oxlint-disable nextjs/no-img-element */
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowUpRight,
  Check,
  ImagePlus,
  LogOut,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import type { Content, Media } from '@/lib/admin/validation';

type Path = (string | number)[];
const sections = [
  ['offers', 'Подорожі'],
  ['hero', 'Перший екран'],
  ['concierge', 'Консьєрж'],
  ['about', 'Про нас'],
  ['contacts', 'Контакти'],
  ['owners', 'Співвласники'],
  ['texts', 'Тексти та сторінки'],
  ['settings', 'SEO сайту'],
] as const;
type Section = (typeof sections)[number][0];
const labels: Record<string, string> = {
  heroTitle: 'Заголовок першого екрана',
  heroText: 'Опис першого екрана',
  primaryCta: 'Головна кнопка',
  secondaryCta: 'Друга кнопка',
  brandLine: 'Підпис під логотипом у фіналі',
  selectedTrips: 'Заголовок добірки турів',
  demoNotice: 'Примітка до добірки',
  collectionLink: 'Посилання на каталог',
  similar: 'Кнопка схожої подорожі',
  manifestTitle: 'Заголовок про підхід',
  manifest: 'Текст про підхід',
  formatsTitle: 'Заголовок форматів',
  workTitle: 'Заголовок процесу',
  ownersTitle: 'Заголовок команди',
  finalTitle: 'Фінальний заклик',
  finalText: 'Опис фінального заклику',
};
async function request(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json' },
  });
  const result = (await res.json()) as {
    content: Content;
    version: string;
    error?: string;
  };
  if (!res.ok) throw new Error(result.error || 'Не вдалося виконати дію.');
  return result;
}
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="admin-group">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function AdminEditor({
  authenticated,
  configured,
}: {
  authenticated: boolean;
  configured: boolean;
}) {
  const [signedIn, setSignedIn] = useState(authenticated);
  const [data, setData] = useState<Content | null>(null);
  const [version, setVersion] = useState('');
  const [section, setSection] = useState<Section>('offers');
  const [selected, setSelected] = useState(0);
  const [locale, setLocale] = useState<'ua' | 'en'>('ua');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(authenticated);
  const [dirty, setDirty] = useState(false);
  const [media, setMedia] = useState<Media[]>([]);
  const [publishedMedia, setPublishedMedia] = useState<Media[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  async function load() {
    setBusy(true);
    setError('');
    try {
      const r = await request('/api/admin/content');
      setData(r.content);
      setVersion(r.version);
      setDirty(false);
      setMedia([]);
      setSelected(0);
      setNotice('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    void request('/api/admin/content')
      .then((r) => {
        if (!cancelled) {
          setData(r.content);
          setVersion(r.version);
          setDirty(false);
          setMedia([]);
          setError('');
        }
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function change(path: Path, value: unknown) {
    setData((previous) => {
      if (!previous) return previous;
      const next = structuredClone(previous);
      let target = next as unknown as Record<string, unknown>;
      for (const key of path.slice(0, -1))
        target = target[key] as Record<string, unknown>;
      target[path[path.length - 1]] = value;
      return next;
    });
    setDirty(true);
    setNotice('');
  }
  function value(path: Path): string | number | boolean {
    return path.reduce<unknown>(
      (result, key) => (result as Record<string, unknown>)?.[key],
      data,
    ) as string | number | boolean;
  }
  function field(label: string, path: Path, multiline = false, type = 'text') {
    const id = `field-${path.join('-')}`;
    return (
      <div className="admin-field" key={id}>
        <label htmlFor={id}>{label}</label>
        {multiline ? (
          <Textarea
            id={id}
            value={String(value(path) ?? '')}
            onChange={(e) => change(path, e.target.value)}
            rows={4}
          />
        ) : (
          <Input
            id={id}
            type={type}
            value={String(value(path) ?? '')}
            onChange={(e) =>
              change(
                path,
                type === 'number' ? Number(e.target.value) : e.target.value,
              )
            }
          />
        )}
      </div>
    );
  }
  function toggle(label: string, path: Path) {
    const id = `toggle-${path.join('-')}`;
    return (
      <label className="admin-toggle" htmlFor={id} key={id}>
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value(path))}
          onChange={(event) => change(path, event.target.checked)}
        />
        <span>{label}</span>
      </label>
    );
  }
  async function upload(file: File | undefined, path: Path) {
    if (!file) return;
    const extension = (
      {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
      } as Record<string, string>
    )[file.type];
    if (!extension || file.size > 2 * 1024 * 1024) {
      setError('Оберіть JPG, PNG або WebP до 2 МБ.');
      return;
    }
    if (
      media.reduce((n, f) => n + f.content.length * 0.75, 0) + file.size >
      3 * 1024 * 1024
    ) {
      setError(
        'До 3 МБ нових фото за одну публікацію. Опублікуйте зміни, потім додайте наступні.',
      );
      return;
    }
    setBusy(true);
    try {
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const asset = `/assets/uploads/${crypto.randomUUID()}.${extension}`;
      setMedia((previous) => [
        ...previous.filter(
          (f) => `/${f.path.replace(/^public\//, '')}` !== value(path),
        ),
        { path: `public${asset}`, content },
      ]);
      change(path, asset);
      setError('');
    } catch {
      setError('Не вдалося прочитати фото. Спробуйте ще раз.');
    } finally {
      setBusy(false);
    }
  }
  function photo(label: string, path: Path) {
    const src = value(path) as string;
    const pending = [...media, ...publishedMedia].find(
      (f) => `/${f.path.replace(/^public\//, '')}` === src,
    );
    const preview = pending
      ? `data:image/${src.endsWith('.jpg') ? 'jpeg' : src.split('.').pop()};base64,${pending.content}`
      : src;
    return (
      <div className="admin-photo" key={path.join('-')}>
        <div className="admin-photo-preview">
          {preview ? (
            <img src={preview} alt={label} referrerPolicy="no-referrer" />
          ) : (
            <span>Додайте зображення</span>
          )}
        </div>
        {field(label, path)}
        <label className="admin-upload">
          <ImagePlus size={16} /> Завантажити фото
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              void upload(e.target.files?.[0], path);
              e.target.value = '';
            }}
          />
        </label>
        <small>
          JPG, PNG або WebP до 2 МБ. Можна вставити HTTPS-посилання.
        </small>
      </div>
    );
  }
  async function login(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await request('/api/admin/session', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      setPassword('');
      setLoading(true);
      setSignedIn(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    if (dirty && !window.confirm('Вийти без публікації змін?')) return;
    setBusy(true);
    try {
      await request('/api/admin/session', { method: 'DELETE' });
      setSignedIn(false);
      setData(null);
      setMedia([]);
      setDirty(false);
      setLoading(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    if (
      !window.confirm(
        'Опублікувати зміни? Сайт оновиться після завершення збірки Vercel.',
      )
    )
      return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const used = media.filter((file) =>
        JSON.stringify(data).includes(`/${file.path.replace(/^public\//, '')}`),
      );
      const result = await request('/api/admin/content', {
        method: 'PUT',
        body: JSON.stringify({ content: data, version, media: used }),
      });
      setVersion(result.version);
      setDirty(false);
      setPublishedMedia((previous) => [...media, ...previous]);
      setMedia([]);
      // Keep uploaded previews until the new deployment serves their URLs.
      setNotice(
        'Зміни збережено. Сайт оновиться після успішної збірки Vercel — зазвичай за кілька хвилин.',
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function exportDraft() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ content: data, media, version }, null, 2)], {
        type: 'application/json',
      }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'obrii-content-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }
  function addOffer() {
    if (!data) return;
    const text = { ua: '', en: '' };
    change(
      ['offers'],
      [
        ...data.offers,
        {
          id: `OBRII-${crypto.randomUUID().slice(0, 8)}`,
          slug: `new-trip-${Date.now()}`,
          published: false,
          featured: false,
          order: data.offers.length + 1,
          title: { ua: 'Нова подорож', en: 'New journey' },
          destination: { ...text },
          format: { ...text },
          season: { ...text },
          duration: { ...text },
          excerpt: { ...text },
          description: { ...text },
          image: '/assets/hero/beach.png',
        },
      ],
    );
    setQuery('');
    setSelected(data.offers.length);
  }
  if (!signedIn)
    return (
      <main className="admin-login">
        <Link href="/" className="admin-wordmark">
          OBRII
        </Link>
        <form onSubmit={login}>
          <span className="admin-eyebrow">ПРОСТІР КОМАНДИ</span>
          <h1>Керування сайтом</h1>
          <p>Подорожі, люди та деталі, які формують OBRII.</p>
          {!configured && (
            <output className="admin-notice">
              Вхід ще не налаштовано. Потрібне підключення адміністратора.
            </output>
          )}
          <label htmlFor="admin-password">Пароль адміністратора</label>
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            maxLength={256}
          />
          {error && (
            <p role="alert" className="admin-error">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy || !configured}>
            {busy ? 'Перевіряємо…' : 'Увійти'}
            <ArrowUpRight size={16} />
          </Button>
          <Link href="/">Повернутися на сайт</Link>
        </form>
      </main>
    );
  const offer = data?.offers[selected];
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-wordmark" href="/">
          OBRII
        </Link>
        <p className="admin-eyebrow">КЕРУВАННЯ САЙТОМ</p>
        <nav aria-label="Розділи адміністратора">
          {sections.map(([id, label], i) => (
            <button
              key={id}
              aria-current={section === id ? 'page' : undefined}
              onClick={() => setSection(id)}
            >
              <span>0{i + 1}</span>
              {label}
              {id === 'offers' && data && <small>{data.offers.length}</small>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <a href="/" target="_blank" rel="noreferrer">
            Відкрити сайт <ArrowUpRight size={16} />
          </a>
          <Button variant="ghost" onClick={logout} disabled={busy}>
            <LogOut size={16} /> Вийти
          </Button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-toolbar">
          <div>
            <span className="admin-eyebrow">КОНТЕНТ OBRII</span>
            <h1>{sections.find((s) => s[0] === section)?.[1]}</h1>
          </div>
          <div className="admin-actions">
            <span className={dirty ? 'admin-unsaved' : 'admin-saved'}>
              {dirty ? (
                'Є неопубліковані зміни'
              ) : (
                <>
                  <Check size={14} /> Збережено
                </>
              )}
            </span>
            <Button
              onClick={publish}
              disabled={busy || loading || !data || !dirty}
            >
              <Save size={16} />
              {busy ? 'Зачекайте…' : 'Опублікувати'}
            </Button>
          </div>
        </header>
        {error && (
          <div role="alert" className="admin-error">
            {error}
          </div>
        )}
        {notice && <output className="admin-notice">{notice}</output>}
        {!data ? (
          <div className="admin-empty">
            <p>
              {busy || loading
                ? 'Завантажуємо контент…'
                : 'Не вдалося завантажити контент.'}
            </p>
            <Button onClick={load} disabled={busy || loading}>
              Спробувати ще раз
            </Button>
          </div>
        ) : (
          <>
            <div className="admin-utility">
              <label>
                Мова контенту{' '}
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as 'ua' | 'en')}
                >
                  <option value="ua">Українська</option>
                  <option value="en">English — наявна версія</option>
                </select>
              </label>
              <div>
                <Button variant="ghost" onClick={exportDraft}>
                  Завантажити копію
                </Button>
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    if (
                      !dirty ||
                      window.confirm(
                        'Завантажити актуальний контент? Неопубліковані зміни буде втрачено.',
                      )
                    )
                      void load();
                  }}
                >
                  Оновити дані
                </Button>
              </div>
            </div>
            <fieldset className="admin-content" disabled={busy || loading}>
              {section === 'offers' && (
                <div className="admin-offers">
                  <div className="admin-offer-list">
                    <Button onClick={addOffer}>
                      <Plus size={16} /> Додати подорож
                    </Button>
                    <Input
                      aria-label="Пошук подорожі"
                      placeholder="Знайти подорож…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {data.offers
                      .map((o, i) => ({ o, i }))
                      .filter(({ o }) =>
                        (o.title.ua + ' ' + o.destination.ua)
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                      )
                      .map(({ o, i }) => (
                        <button
                          className={selected === i ? 'active' : ''}
                          key={o.id}
                          onClick={() => setSelected(i)}
                        >
                          <span>{o.title.ua || 'Без назви'}</span>
                          <small>
                            {o.published ? 'На сайті' : 'Приховано'}
                            {o.featured ? ' · На головній' : ''}
                          </small>
                        </button>
                      ))}
                  </div>
                  {offer ? (
                    <div>
                      <Group title={offer.title[locale] || 'Нова подорож'}>
                        <div className="admin-checks">
                          <label>
                            <input
                              type="checkbox"
                              checked={offer.published}
                              onChange={(e) =>
                                change(
                                  ['offers', selected, 'published'],
                                  e.target.checked,
                                )
                              }
                            />{' '}
                            Показувати на сайті
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={offer.featured}
                              onChange={(e) =>
                                change(
                                  ['offers', selected, 'featured'],
                                  e.target.checked,
                                )
                              }
                            />{' '}
                            У добірці на головній
                          </label>
                        </div>
                        <div className="admin-grid">
                          {field('Назва', [
                            'offers',
                            selected,
                            'title',
                            locale,
                          ])}
                          {field('Напрямок', [
                            'offers',
                            selected,
                            'destination',
                            locale,
                          ])}
                          {field('URL — латиниця через дефіс', [
                            'offers',
                            selected,
                            'slug',
                          ])}
                          {field(
                            'Порядок показу',
                            ['offers', selected, 'order'],
                            false,
                            'number',
                          )}
                          {field('Формат', [
                            'offers',
                            selected,
                            'format',
                            locale,
                          ])}
                          {field('Сезон', [
                            'offers',
                            selected,
                            'season',
                            locale,
                          ])}
                          {field('Тривалість', [
                            'offers',
                            selected,
                            'duration',
                            locale,
                          ])}
                          {field('ID пропозиції', ['offers', selected, 'id'])}
                        </div>
                        {field(
                          'Короткий опис',
                          ['offers', selected, 'excerpt', locale],
                          true,
                        )}
                        {field(
                          'Детальний опис / програма',
                          ['offers', selected, 'description', locale],
                          true,
                        )}
                        {photo('Фото подорожі', ['offers', selected, 'image'])}
                        <Button
                          variant="destructive"
                          onClick={() => {
                            if (
                              window.confirm(`Видалити «${offer.title.ua}»?`)
                            ) {
                              change(
                                ['offers'],
                                data.offers.filter((_, i) => i !== selected),
                              );
                              setSelected(0);
                            }
                          }}
                        >
                          <Trash2 size={16} /> Видалити подорож
                        </Button>
                      </Group>
                    </div>
                  ) : (
                    <div className="admin-empty">Додайте першу подорож.</div>
                  )}
                </div>
              )}
              {section === 'hero' && (
                <>
                  <p className="admin-intro">
                    Три сцени анімації не залежать від каталогу подорожей.
                    Замінюйте зображення, зберігаючи композицію.
                  </p>
                  <div className="admin-grid admin-three">
                    {data.heroPanels.map((p, i) => (
                      <Group
                        title={['Море та пляж', 'Гори', 'Події'][i]}
                        key={p.id}
                      >
                        {photo('Зображення', ['heroPanels', i, 'image'])}
                        {field('Опис зображення', [
                          'heroPanels',
                          i,
                          'alt',
                          locale,
                        ])}
                        {field('Фокус desktop — X% Y%', [
                          'heroPanels',
                          i,
                          'desktopPosition',
                        ])}
                        {field('Фокус mobile — X% Y%', [
                          'heroPanels',
                          i,
                          'mobilePosition',
                        ])}
                      </Group>
                    ))}
                  </div>
                  <Group title="Текст першого екрана">
                    {field('Заголовок', ['copy', locale, 'heroTitle'])}
                    {field('Опис', ['copy', locale, 'heroText'], true)}
                  </Group>
                </>
              )}
              {section === 'concierge' && (
                <>
                  <p className="admin-intro">
                    Контент окремої сторінки /concierge. Системні поля форми та
                    Telegram-доставка залишаються під контролем розробника.
                  </p>
                  <Group title="Перший екран">
                    {photo('Зображення', ['conciergePage', 'hero', 'image'])}
                    {field('Опис зображення', [
                      'conciergePage',
                      'hero',
                      'alt',
                      locale,
                    ])}
                    {field('Надзаголовок', [
                      'conciergePage',
                      'hero',
                      'eyebrow',
                      locale,
                    ])}
                    {field('Заголовок', [
                      'conciergePage',
                      'hero',
                      'title',
                      locale,
                    ])}
                    {field(
                      'Опис',
                      ['conciergePage', 'hero', 'description', locale],
                      true,
                    )}
                    <div className="admin-grid">
                      {field('Головна кнопка', [
                        'conciergePage',
                        'hero',
                        'primaryCta',
                        locale,
                      ])}
                      {field('Друга кнопка', [
                        'conciergePage',
                        'hero',
                        'secondaryCta',
                        locale,
                      ])}
                    </div>
                  </Group>
                  <Group title="Послуги">
                    <div className="admin-grid">
                      {field('Надзаголовок', [
                        'conciergePage',
                        'services',
                        'eyebrow',
                        locale,
                      ])}
                      {field('Заголовок', [
                        'conciergePage',
                        'services',
                        'heading',
                        locale,
                      ])}
                    </div>
                    {field(
                      'Вступ',
                      ['conciergePage', 'services', 'intro', locale],
                      true,
                    )}
                  </Group>
                  <div className="admin-grid">
                    {data.conciergePage.services.items.map((service, i) => (
                      <Group title={service.title[locale]} key={service.id}>
                        <small className="admin-stable-id">
                          ID: {service.id}
                        </small>
                        {toggle('Показувати на сайті', [
                          'conciergePage',
                          'services',
                          'items',
                          i,
                          'visible',
                        ])}
                        {field(
                          'Порядок',
                          ['conciergePage', 'services', 'items', i, 'order'],
                          false,
                          'number',
                        )}
                        {photo('Фото', [
                          'conciergePage',
                          'services',
                          'items',
                          i,
                          'image',
                        ])}
                        {field('Опис фото', [
                          'conciergePage',
                          'services',
                          'items',
                          i,
                          'alt',
                          locale,
                        ])}
                        {field('Назва', [
                          'conciergePage',
                          'services',
                          'items',
                          i,
                          'title',
                          locale,
                        ])}
                        {field(
                          'Опис',
                          [
                            'conciergePage',
                            'services',
                            'items',
                            i,
                            'description',
                            locale,
                          ],
                          true,
                        )}
                      </Group>
                    ))}
                  </div>
                  <Group title="Процес">
                    <div className="admin-grid">
                      {field('Надзаголовок', [
                        'conciergePage',
                        'process',
                        'eyebrow',
                        locale,
                      ])}
                      {field('Заголовок', [
                        'conciergePage',
                        'process',
                        'heading',
                        locale,
                      ])}
                    </div>
                    {data.conciergePage.process.steps.map((step, i) => (
                      <div className="admin-grid" key={step.number}>
                        {field(`Крок ${step.number}`, [
                          'conciergePage',
                          'process',
                          'steps',
                          i,
                          'title',
                          locale,
                        ])}
                        {field(
                          'Опис',
                          [
                            'conciergePage',
                            'process',
                            'steps',
                            i,
                            'description',
                            locale,
                          ],
                          true,
                        )}
                      </div>
                    ))}
                  </Group>
                  <Group title="Приклади запитів">
                    <div className="admin-grid">
                      {field('Надзаголовок', [
                        'conciergePage',
                        'examples',
                        'eyebrow',
                        locale,
                      ])}
                      {field('Заголовок', [
                        'conciergePage',
                        'examples',
                        'heading',
                        locale,
                      ])}
                    </div>
                    {data.conciergePage.examples.items.map((example, i) => (
                      <div className="admin-grid" key={example.id}>
                        {toggle('Показувати', [
                          'conciergePage',
                          'examples',
                          'items',
                          i,
                          'visible',
                        ])}
                        {field(
                          'Порядок',
                          ['conciergePage', 'examples', 'items', i, 'order'],
                          false,
                          'number',
                        )}
                        {field('Назва', [
                          'conciergePage',
                          'examples',
                          'items',
                          i,
                          'title',
                          locale,
                        ])}
                        {field(
                          'Опис',
                          [
                            'conciergePage',
                            'examples',
                            'items',
                            i,
                            'text',
                            locale,
                          ],
                          true,
                        )}
                      </div>
                    ))}
                    {field('Кнопка іншого запиту', [
                      'conciergePage',
                      'examples',
                      'otherCta',
                      locale,
                    ])}
                  </Group>
                  <Group title="Форма">
                    {field('Надзаголовок', [
                      'conciergePage',
                      'form',
                      'eyebrow',
                      locale,
                    ])}
                    {field('Заголовок', [
                      'conciergePage',
                      'form',
                      'heading',
                      locale,
                    ])}
                    {field(
                      'Вступ',
                      ['conciergePage', 'form', 'intro', locale],
                      true,
                    )}
                    {field(
                      'Примітка',
                      ['conciergePage', 'form', 'note', locale],
                      true,
                    )}
                    {field(
                      'Повідомлення про успіх',
                      ['conciergePage', 'form', 'success', locale],
                      true,
                    )}
                    {field(
                      'Повідомлення про помилку',
                      ['conciergePage', 'form', 'error', locale],
                      true,
                    )}
                  </Group>
                  <Group title="Поширені запитання">
                    <div className="admin-grid">
                      {field('Надзаголовок', [
                        'conciergePage',
                        'faq',
                        'eyebrow',
                        locale,
                      ])}
                      {field('Заголовок', [
                        'conciergePage',
                        'faq',
                        'heading',
                        locale,
                      ])}
                    </div>
                    {data.conciergePage.faq.items.map((faq, i) => (
                      <div className="admin-grid" key={faq.id}>
                        {toggle('Показувати', [
                          'conciergePage',
                          'faq',
                          'items',
                          i,
                          'visible',
                        ])}
                        {field(
                          'Порядок',
                          ['conciergePage', 'faq', 'items', i, 'order'],
                          false,
                          'number',
                        )}
                        {field('Питання', [
                          'conciergePage',
                          'faq',
                          'items',
                          i,
                          'question',
                          locale,
                        ])}
                        {field(
                          'Відповідь',
                          [
                            'conciergePage',
                            'faq',
                            'items',
                            i,
                            'answer',
                            locale,
                          ],
                          true,
                        )}
                      </div>
                    ))}
                  </Group>
                  <Group title="SEO сторінки">
                    {field('Заголовок', ['conciergePage', 'seo', 'title'])}
                    {field(
                      'Опис',
                      ['conciergePage', 'seo', 'description'],
                      true,
                    )}
                    {photo('Зображення для поширення', [
                      'conciergePage',
                      'seo',
                      'image',
                    ])}
                  </Group>
                </>
              )}
              {section === 'owners' && (
                <div className="admin-grid">
                  {data.owners.map((o, i) => (
                    <Group title={o.name[locale]} key={i}>
                      {field('Ім’я та прізвище', ['owners', i, 'name', locale])}
                      {field('Роль', ['owners', i, 'role', locale])}
                      {field('Досвід', ['owners', i, 'note', locale])}
                      {field(
                        'Короткий опис',
                        ['owners', i, 'description', locale],
                        true,
                      )}
                      {photo('Основний портрет', ['owners', i, 'image'])}
                      {field('Позиція основного фото — X% Y%', [
                        'owners',
                        i,
                        'imagePosition',
                      ])}
                      {photo('Портрет на відпочинку', [
                        'owners',
                        i,
                        'holidayImage',
                      ])}
                      {field('Позиція фото на відпочинку — X% Y%', [
                        'owners',
                        i,
                        'holidayImagePosition',
                      ])}
                    </Group>
                  ))}
                </div>
              )}
              {section === 'about' && (
                <>
                  <Group title="Перший екран">
                    <div className="admin-grid">
                      {field('Надзаголовок', [
                        'aboutPage',
                        'hero',
                        'eyebrow',
                        locale,
                      ])}
                      {field('Заголовок', [
                        'aboutPage',
                        'hero',
                        'title',
                        locale,
                      ])}
                      {field(
                        'Опис',
                        ['aboutPage', 'hero', 'description', locale],
                        true,
                      )}
                      {field('Кнопка', ['aboutPage', 'hero', 'cta', locale])}
                    </div>
                    {photo('Головне зображення', [
                      'aboutPage',
                      'hero',
                      'image',
                    ])}
                    {field('Фокус зображення — X% Y%', [
                      'aboutPage',
                      'hero',
                      'imagePosition',
                    ])}
                    {field('Альтернативний текст', [
                      'aboutPage',
                      'hero',
                      'alt',
                      locale,
                    ])}
                  </Group>
                  <Group title="Підхід">
                    {field('Заголовок', [
                      'aboutPage',
                      'approach',
                      'heading',
                      locale,
                    ])}
                    {data.aboutPage.approach.paragraphs.map((_, i) =>
                      field(
                        `Абзац ${i + 1}`,
                        ['aboutPage', 'approach', 'paragraphs', i, locale],
                        true,
                      ),
                    )}
                  </Group>
                  <Group title="Команда">
                    {field('Заголовок', ['aboutPage', 'teamHeading', locale])}
                    <p className="admin-hint">
                      Імена, ролі, досвід, описи й фото редагуються в розділі
                      «Співвласники».
                    </p>
                  </Group>
                  <Group title="Принципи роботи">
                    {field('Заголовок', [
                      'aboutPage',
                      'principles',
                      'heading',
                      locale,
                    ])}
                    <div className="admin-grid">
                      {data.aboutPage.principles.items.map((item, i) => (
                        <div key={item.id} className="admin-subgroup">
                          {field('Назва', [
                            'aboutPage',
                            'principles',
                            'items',
                            i,
                            'title',
                            locale,
                          ])}
                          {field(
                            'Опис',
                            [
                              'aboutPage',
                              'principles',
                              'items',
                              i,
                              'description',
                              locale,
                            ],
                            true,
                          )}
                          {field(
                            'Порядок',
                            ['aboutPage', 'principles', 'items', i, 'order'],
                            false,
                            'number',
                          )}
                          {toggle('Показувати', [
                            'aboutPage',
                            'principles',
                            'items',
                            i,
                            'visible',
                          ])}
                        </div>
                      ))}
                    </div>
                  </Group>
                  <Group title="Фінальний заклик">
                    {field('Заголовок', [
                      'aboutPage',
                      'finalCta',
                      'heading',
                      locale,
                    ])}
                    {field(
                      'Опис',
                      ['aboutPage', 'finalCta', 'description', locale],
                      true,
                    )}
                    <div className="admin-grid">
                      {field('Головна кнопка', [
                        'aboutPage',
                        'finalCta',
                        'primary',
                        locale,
                      ])}
                      {field('Друге посилання', [
                        'aboutPage',
                        'finalCta',
                        'secondary',
                        locale,
                      ])}
                    </div>
                  </Group>
                  <Group title="SEO сторінки">
                    {field('Заголовок', ['aboutPage', 'seo', 'title'])}
                    {field('Опис', ['aboutPage', 'seo', 'description'], true)}
                    {photo('Зображення для поширення', [
                      'aboutPage',
                      'seo',
                      'image',
                    ])}
                  </Group>
                </>
              )}
              {section === 'contacts' && (
                <>
                  <Group title="Тексти сторінки">
                    <div className="admin-grid">
                      {field('Надзаголовок', [
                        'contactsPage',
                        'hero',
                        'eyebrow',
                        locale,
                      ])}
                      {field('Заголовок', [
                        'contactsPage',
                        'hero',
                        'title',
                        locale,
                      ])}
                      {field(
                        'Вступ',
                        ['contactsPage', 'hero', 'description', locale],
                        true,
                      )}
                      {field('Заголовок онлайн-роботи', [
                        'contactsPage',
                        'online',
                        'heading',
                        locale,
                      ])}
                      {field(
                        'Опис онлайн-роботи',
                        ['contactsPage', 'online', 'text', locale],
                        true,
                      )}
                      {field('Заголовок форми', [
                        'contactsPage',
                        'form',
                        'heading',
                        locale,
                      ])}
                      {field(
                        'Опис форми',
                        ['contactsPage', 'form', 'description', locale],
                        true,
                      )}
                    </div>
                  </Group>
                  <Group title="Спільні контакти">
                    <div className="admin-grid">
                      {field('Телефон', ['site', 'phone'])}
                      {field('Email', ['site', 'email'], false, 'email')}
                      {field('Telegram — @username або посилання t.me', [
                        'site',
                        'telegram',
                      ])}
                      {field('WhatsApp — номер з кодом країни', [
                        'site',
                        'whatsapp',
                      ])}
                      {field('Години роботи', ['site', 'workingHours', locale])}
                      {field(
                        'Instagram — HTTPS-посилання',
                        ['site', 'instagram'],
                        false,
                        'url',
                      )}
                      {field(
                        'Facebook — HTTPS-посилання',
                        ['site', 'facebook'],
                        false,
                        'url',
                      )}
                    </div>
                    <p className="admin-hint">
                      Порожні або нульові контакти не показуються на сайті.
                    </p>
                  </Group>
                  <Group title="SEO сторінки">
                    {field('Заголовок', ['contactsPage', 'seo', 'title'])}
                    {field(
                      'Опис',
                      ['contactsPage', 'seo', 'description'],
                      true,
                    )}
                    {photo('Зображення для поширення', [
                      'contactsPage',
                      'seo',
                      'image',
                    ])}
                  </Group>
                </>
              )}
              {section === 'texts' && (
                <>
                  <Group title="Головна сторінка">
                    {Object.entries(labels).map(([key, label]) =>
                      field(
                        label,
                        ['copy', locale, key],
                        !key.toLowerCase().includes('title'),
                      ),
                    )}
                    {data.copy[locale].nav.map((_, i) =>
                      field(`Пункт меню ${i + 1}`, ['copy', locale, 'nav', i]),
                    )}
                  </Group>
                  <Group title="Консьєрж-сервіс">
                    {data.conciergeItems[locale].map((_, i) =>
                      field(`Послуга ${i + 1}`, ['conciergeItems', locale, i]),
                    )}
                  </Group>
                  {Object.entries(data.pages).map(([key, p]) => (
                    <Group key={key} title={p.title[locale]}>
                      {field('Заголовок', ['pages', key, 'title', locale])}
                      {field(
                        'Текст сторінки',
                        ['pages', key, 'text', locale],
                        true,
                      )}
                    </Group>
                  ))}
                  {(['workSteps', 'formatCards'] as const).map((key) => (
                    <Group
                      key={key}
                      title={
                        key === 'workSteps'
                          ? 'Як ми працюємо'
                          : 'Формати подорожей'
                      }
                    >
                      {data[key][locale].map((_, i) => (
                        <div className="admin-grid" key={i}>
                          {field(`Заголовок ${i + 1}`, [key, locale, i, 0])}
                          {field('Опис', [key, locale, i, 1], true)}
                        </div>
                      ))}
                    </Group>
                  ))}
                  <Group title="Варіанти у формі підбору">
                    {data.tripFormats.map((_, i) =>
                      field(`Формат ${i + 1}`, ['tripFormats', i, locale]),
                    )}
                  </Group>
                  <Group title="Нижня частина сайту">
                    {field('Опис', ['footer', 'description', locale], true)}
                    {field(
                      'Реквізити та юридична інформація',
                      ['footer', 'legal', locale],
                      true,
                    )}
                    {field(
                      'Примітка на сторінці туру',
                      ['detailNote', locale],
                      true,
                    )}
                  </Group>
                </>
              )}
              {section === 'settings' && (
                <>
                  <Group title="Пошукові системи та поширення">
                    {field('Заголовок сайту', ['seo', 'title'])}
                    {field('Опис для пошуку', ['seo', 'description'], true)}
                    {field(
                      'Основна адреса сайту — https://…',
                      ['seo', 'url'],
                      false,
                      'url',
                    )}
                    {photo('Зображення для поширення', ['seo', 'image'])}
                  </Group>
                </>
              )}
            </fieldset>
          </>
        )}
      </main>
    </div>
  );
}
