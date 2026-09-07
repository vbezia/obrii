'use client';

/* oxlint-disable react/react-compiler, nextjs/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Languages,
  MapPin,
  Menu,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Progress, ProgressLabel } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  conciergeItems,
  copy,
  getOffer,
  heroPanels,
  offers,
  owners,
  principles,
  site,
  tripFormats,
  workSteps,
  type Locale,
} from '@/lib/content';

const formatCards = {
  ua: [
    ['Private escapes', 'Тиша, приватні простори, готелі й резиденції з правильним ритмом.'],
    ['Сімейні подорожі', 'Маршрути, де дітям комфортно, а дорослим не потрібно координувати дрібниці.'],
    ['Яхти та вілли', 'Команда, сервіс, маршрути і берегові зупинки під ваш темп.'],
    ['Wellness і retreat', 'Відновлення без показної розкоші, з фокусом на тишу та якість.'],
    ['Гастрономія', 'Резервації, локальні експерти і маршрути навколо смаку.'],
    ['Події', 'Hospitality, квитки, проживання і приватна програма навколо події.'],
  ],
  en: [
    ['Private escapes', 'Quiet places, private spaces and stays with the right rhythm.'],
    ['Family journeys', 'Routes where children are comfortable and adults do not coordinate details.'],
    ['Yachts and villas', 'Crew, service, routes and shore stops around your pace.'],
    ['Wellness retreats', 'Recovery without loud luxury, focused on privacy and quality.'],
    ['Gastronomy', 'Reservations, local experts and routes built around taste.'],
    ['Events', 'Hospitality, tickets, stays and a private program around the event.'],
  ],
};

function withLocale(path: string, locale: Locale) {
  const joiner = path.includes('?') ? '&' : '?';
  return locale === 'en' ? `${path}${joiner}lang=en` : path;
}

export function Header({
  locale,
  setLocale,
}: {
  locale: Locale;
  setLocale?: (locale: Locale) => void;
}) {
  const t = copy[locale];
  const navTargets = ['/offers', '/concierge', '/offers', '/about', '/contacts'];
  return (
    <header className="site-header">
      <Link href={withLocale('/', locale)} className="brand" aria-label="OBRII home">
        <img src="/assets/brand/logo.png" alt="OBRII" />
      </Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        {t.nav.map((item, index) => (
          <Link key={`${item}-${index}`} href={withLocale(navTargets[index], locale)}>
            {item}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        <button
          className="lang-toggle"
          type="button"
          onClick={() => setLocale?.(locale === 'ua' ? 'en' : 'ua')}
          aria-label="Switch language"
        >
          <Languages aria-hidden="true" />
          {locale === 'ua' ? 'EN' : 'UA'}
        </button>
        <Link
          href={withLocale('/plan-your-trip', locale)}
          className="obrii-button cta-link header-cta"
        >
          {t.primaryCta}
        </Link>
        <button className="mobile-menu" type="button" aria-label="Menu">
          <Menu aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

function Footer({ locale }: { locale: Locale }) {
  return (
    <footer className="footer">
      <div>
        <img src="/assets/brand/logo.png" alt="OBRII" />
        <p>
          {locale === 'ua'
            ? 'Індивідуальні подорожі, concierge і подієвий туризм.'
            : 'Private travel, concierge and event tourism.'}
        </p>
      </div>
      <div>
        <h2>{locale === 'ua' ? 'Контакти' : 'Contacts'}</h2>
        <a href={`tel:${site.phone.replaceAll(' ', '')}`}>{site.phone}</a>
        <a href={`mailto:${site.email}`}>{site.email}</a>
        <a href="https://t.me/obrii_travel">{site.telegram}</a>
      </div>
      <div>
        <h2>{locale === 'ua' ? 'Документи' : 'Documents'}</h2>
        <Link href={withLocale('/privacy', locale)}>
          {locale === 'ua' ? 'Політика конфіденційності' : 'Privacy policy'}
        </Link>
        <Link href={withLocale('/cookies', locale)}>Cookies</Link>
        <Link href={withLocale('/terms', locale)}>
          {locale === 'ua' ? 'Умови користування' : 'Terms'}
        </Link>
      </div>
      <div>
        <h2>{locale === 'ua' ? 'Примітка' : 'Note'}</h2>
        <p>
          {locale === 'ua'
            ? 'Реквізити юридичної особи та туроператорські дані потрібно додати перед запуском.'
            : 'Legal entity and tour operator details should be added before launch.'}
        </p>
      </div>
    </footer>
  );
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduceMotion) {
      setProgress(1);
      return;
    }
    const update = () => {
      const hero = document.getElementById('hero');
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      const available = Math.max(1, rect.height - window.innerHeight);
      setProgress(Math.min(1, Math.max(0, -rect.top / available)));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return progress;
}

function Hero({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const progress = useScrollProgress();
  const introOpacity = Math.max(0, 1 - progress * 2.8);
  const logoOpacity = Math.max(0, Math.min(1, (progress - 0.82) / 0.16));
  const transforms = [
    `translate3d(${-progress * 7}vw, ${-progress * 16}vh, 0) rotate(${-progress * 3}deg) scale(${1 - progress * 0.04})`,
    `translate3d(0, ${progress * 10}vh, 0) scale(${1 + progress * 0.18})`,
    `translate3d(${progress * 7}vw, ${-progress * 16}vh, 0) rotate(${progress * 3}deg) scale(${1 - progress * 0.04})`,
  ];

  return (
    <section id="hero" className="hero-scroll" aria-label={t.heroTitle}>
      <div className="hero-stage">
        <div
          className="hero-intro"
          style={{
            opacity: introOpacity,
            transform: `translateY(${-progress * 34}px)`,
          }}
        >
          <p className="eyebrow">VIP travel concierge</p>
          <h1>{t.heroTitle}</h1>
          <p>{t.heroText}</p>
          <div className="hero-actions">
            <Link
              href={withLocale('/plan-your-trip', locale)}
              className="obrii-button cta-link"
            >
              {t.primaryCta}
            </Link>
            <a href="#concierge" className="obrii-outline cta-link">
              {t.secondaryCta}
            </a>
          </div>
        </div>
        <svg className="route-line" viewBox="0 0 1000 420" aria-hidden="true">
          <path
            d="M78 268 C218 100 368 114 493 228 S768 364 928 118"
            pathLength="1"
            style={{ strokeDashoffset: Math.max(0, 1 - progress * 1.4) }}
          />
        </svg>
        <div className="hero-panels">
          {heroPanels.map((panel, index) => (
            <figure
              className={cn('hero-panel', index === 1 && 'hero-panel-center')}
              key={panel.id}
              style={{
                transform: transforms[index],
                zIndex: index === 1 ? 3 : 2,
              }}
            >
              <img src={panel.image} alt={panel.alt[locale]} />
            </figure>
          ))}
        </div>
        <div
          className="hero-logo"
          style={{
            opacity: logoOpacity,
            transform: `translateY(${(1 - logoOpacity) * 20}px)`,
          }}
        >
          <img src="/assets/brand/logo.png" alt="OBRII" />
        </div>
      </div>
    </section>
  );
}

function OfferCard({
  offer,
  locale,
}: {
  offer: (typeof offers)[number];
  locale: Locale;
}) {
  return (
    <article className="offer-card">
      <Link
        href={withLocale(`/offers/${offer.slug}`, locale)}
        className="offer-media"
        aria-label={offer.title[locale]}
      >
        <img src={offer.image} alt={offer.title[locale]} loading="lazy" />
      </Link>
      <div className="offer-copy">
        <p className="eyebrow">{offer.destination[locale]}</p>
        <h3>{offer.title[locale]}</h3>
        <p>{offer.excerpt[locale]}</p>
        <dl>
          <div>
            <dt>{locale === 'ua' ? 'Тривалість' : 'Duration'}</dt>
            <dd>{offer.duration[locale]}</dd>
          </div>
          <div>
            <dt>{locale === 'ua' ? 'Сезон' : 'Season'}</dt>
            <dd>{offer.season[locale]}</dd>
          </div>
        </dl>
        <Link
          href={withLocale(`/plan-your-trip?offer=${offer.slug}`, locale)}
          className="obrii-outline cta-link"
        >
          {copy[locale].similar}
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export function HomePage() {
  const [locale, setLocale] = useState<Locale>('ua');
  const t = copy[locale];
  const featured = offers
    .filter((offer) => offer.featured)
    .sort((a, b) => a.order - b.order)
    .slice(0, 6);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('lang') === 'en') {
      setLocale('en');
    }
  }, []);

  return (
    <>
      <Header locale={locale} setLocale={setLocale} />
      <main>
        <Hero locale={locale} />
        <section className="section private-collection" id="offers">
          <div className="section-heading">
            <p className="eyebrow">Private collection</p>
            <h2>{t.selectedTrips}</h2>
            <p>{t.demoNotice}</p>
          </div>
          <div className="offer-grid">
            {featured.map((offer) => (
              <OfferCard key={offer.id} offer={offer} locale={locale} />
            ))}
          </div>
          <Link className="text-link" href={withLocale('/offers', locale)}>
            {t.collectionLink}
          </Link>
        </section>
        <section className="section manifesto">
          <h2>{t.manifestTitle}</h2>
          <p>{t.manifest}</p>
        </section>
        <section className="section split-section">
          <div className="section-heading">
            <p className="eyebrow">Experience formats</p>
            <h2>{t.formatsTitle}</h2>
          </div>
          <div className="format-grid">
            {formatCards[locale].map(([title, text]) => (
              <article className="format-card" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="section work">
          <div className="section-heading">
            <p className="eyebrow">Process</p>
            <h2>{t.workTitle}</h2>
          </div>
          <div className="timeline">
            {workSteps[locale].map(([title, text], index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="section concierge" id="concierge">
          <div>
            <p className="eyebrow">Always arranged</p>
            <h2>{t.conciergeTitle}</h2>
            <p>
              {locale === 'ua'
                ? 'Сервіс працює як постійний супровід, а не як список додаткових опцій.'
                : 'The service works as ongoing support, not as a list of add-ons.'}
            </p>
          </div>
          <ul>
            {conciergeItems[locale].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section className="section principles">
          <div className="section-heading">
            <p className="eyebrow">Trust</p>
            <h2>{t.principlesTitle}</h2>
          </div>
          <div className="principle-grid">
            {principles[locale].map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </section>
        <section className="section owners">
          <div className="section-heading">
            <p className="eyebrow">OBRII</p>
            <h2>{t.ownersTitle}</h2>
          </div>
          <div className="owner-grid">
            {owners.map((owner) => (
              <article className="owner-card" key={owner.name.ua}>
                <img src={owner.image} alt={owner.name[locale]} loading="lazy" />
                <div>
                  <h3>{owner.name[locale]}</h3>
                  <p>{owner.role}</p>
                  <span>{owner.note[locale]}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="section final-cta">
          <h2>{t.finalTitle}</h2>
          <p>{t.finalText}</p>
          <Link
            href={withLocale('/plan-your-trip', locale)}
            className="obrii-button cta-link"
          >
            {t.primaryCta}
            <Send aria-hidden="true" />
          </Link>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}

type PlannerState = {
  destination: string;
  undecided: boolean;
  formats: string[];
  startDate: string;
  endDate: string;
  month: string;
  flexibleDates: boolean;
  adults: number;
  children: number;
  childAges: string[];
  departure: string;
  budget: string;
  currency: 'EUR' | 'USD' | 'UAH';
  budgetType: 'total' | 'person';
  needBudgetAdvice: boolean;
  wishes: string;
  name: string;
  contactMethod: 'phone' | 'telegram' | 'whatsapp' | 'email';
  contact: string;
  otherContacts: string;
  contactTime: string;
  consent: boolean;
  website: string;
};

const initialPlanner: PlannerState = {
  destination: '',
  undecided: false,
  formats: [],
  startDate: '',
  endDate: '',
  month: '',
  flexibleDates: false,
  adults: 2,
  children: 0,
  childAges: [],
  departure: '',
  budget: '',
  currency: 'EUR',
  budgetType: 'total',
  needBudgetAdvice: false,
  wishes: '',
  name: '',
  contactMethod: 'telegram',
  contact: '',
  otherContacts: '',
  contactTime: '',
  consent: false,
  website: '',
};

const plannerLabels = {
  ua: {
    title: 'Підібрати індивідуальну подорож',
    intro:
      'Це заявка на персональний підбір менеджером. Ми не просимо паспортні дані або платіжні реквізити.',
    steps: ['Побажання', 'Дати і мандрівники', 'Бюджет і деталі', 'Контакти'],
    next: 'Далі',
    back: 'Назад',
    submit: 'Надіслати заявку',
    sending: 'Надсилаємо',
    retry: 'Спробувати ще раз',
    success:
      'Дякуємо! Ми отримали ваш запит. Команда OBRII зв’яжеться з вами для уточнення деталей.',
    error:
      'Не вдалося доставити заявку. Дані збережено, можна повторити відправку.',
  },
  en: {
    title: 'Plan a private journey',
    intro:
      'This is a request for personal curation by a manager. We do not ask for passport or payment details.',
    steps: ['Preferences', 'Dates and travelers', 'Budget and details', 'Contacts'],
    next: 'Next',
    back: 'Back',
    submit: 'Send request',
    sending: 'Sending',
    retry: 'Try again',
    success:
      'Thank you! We received your request. The OBRII team will contact you to clarify the details.',
    error:
      'The request could not be delivered. Your details are saved, so you can try again.',
  },
};

function normalizeChildren(count: number, ages: string[]) {
  return Array.from({ length: count }, (_, index) => ages[index] ?? '');
}

export function TripPlannerPage() {
  const [locale, setLocale] = useState<Locale>('ua');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<PlannerState>(initialPlanner);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [source, setSource] = useState<Record<string, string>>({});

  useEffect(() => {
    const modelContext = (
      document as Document & {
        modelContext?: {
          registerTool?: (
            tool: {
              name: string;
              title: string;
              description: string;
              inputSchema: object;
              annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
              execute: (input: unknown) => { ok: boolean; step: number };
            },
            options?: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();
    const isObject = (value: unknown): value is Record<string, unknown> =>
      Boolean(value) && typeof value === 'object' && !Array.isArray(value);

    void Promise.resolve(
      modelContext.registerTool(
        {
          name: 'stage_obrii_trip_request',
          title: 'Stage OBRII trip request',
          description:
            'Prefill the visible OBRII planning form with known trip preferences and move the visitor to the contact step for review before sending.',
          inputSchema: {
            type: 'object',
            properties: {
              destination: { type: 'string' },
              formats: { type: 'array', items: { type: 'string' } },
              month: { type: 'string' },
              adults: { type: 'number' },
              children: { type: 'number' },
              budget: { type: 'string' },
              currency: { enum: ['EUR', 'USD', 'UAH'] },
              wishes: { type: 'string' },
              name: { type: 'string' },
              contactMethod: { enum: ['phone', 'telegram', 'whatsapp', 'email'] },
            },
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: true },
          execute(input) {
            if (!isObject(input)) throw new Error('Input must be an object.');
            setForm((current) => ({
              ...current,
              destination: cleanString(input.destination, current.destination),
              formats: Array.isArray(input.formats)
                ? input.formats.map((item) => String(item)).slice(0, 6)
                : current.formats,
              month: cleanString(input.month, current.month),
              adults: typeof input.adults === 'number' ? Math.max(1, input.adults) : current.adults,
              children: typeof input.children === 'number' ? Math.max(0, input.children) : current.children,
              budget: cleanString(input.budget, current.budget),
              currency: isCurrency(input.currency) ? input.currency : current.currency,
              wishes: cleanString(input.wishes, current.wishes),
              name: cleanString(input.name, current.name),
              contactMethod: isContactMethod(input.contactMethod) ? input.contactMethod : current.contactMethod,
            }));
            setStep(3);
            return { ok: true, step: 4 };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('lang') === 'en') setLocale('en');
    const offerSlug = params.get('offer') ?? '';
    const offer = offerSlug ? getOffer(offerSlug) : undefined;
    const sourceData: Record<string, string> = {
      page: window.location.href,
      referrer: document.referrer,
    };
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((key) => {
      const value = params.get(key);
      if (value) sourceData[key] = value;
    });
    if (offer) {
      sourceData.offerId = offer.id;
      sourceData.offerTitle = offer.title.ua;
      sourceData.offerSlug = offer.slug;
      sourceData.offerUrl = `${window.location.origin}/offers/${offer.slug}`;
    }
    setSource(sourceData);
  }, []);

  const labels = plannerLabels[locale];
  const progress = ((step + 1) / labels.steps.length) * 100;

  function update<T extends keyof PlannerState>(key: T, value: PlannerState[T]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  }

  function validate(targetStep = step) {
    const nextErrors: Record<string, string> = {};
    if (targetStep === 0 && !form.undecided && form.destination.trim().length < 2) {
      nextErrors.destination = locale === 'ua' ? 'Вкажіть напрям або оберіть варіант нижче.' : 'Add a destination or choose the option below.';
    }
    if (targetStep === 0 && form.formats.length === 0) {
      nextErrors.formats = locale === 'ua' ? 'Оберіть хоча б один формат.' : 'Choose at least one format.';
    }
    if (targetStep === 1 && !form.flexibleDates && !form.month && (!form.startDate || !form.endDate)) {
      nextErrors.dates = locale === 'ua' ? 'Вкажіть дати, місяць або гнучкість.' : 'Add dates, a month or flexible dates.';
    }
    if (targetStep === 1 && form.children > 0 && form.childAges.some((age) => !age.trim())) {
      nextErrors.childAges = locale === 'ua' ? 'Додайте вік кожної дитини.' : 'Add each child age.';
    }
    if (targetStep === 2 && !form.needBudgetAdvice && (!form.budget || Number(form.budget) <= 0)) {
      nextErrors.budget = locale === 'ua' ? 'Вкажіть бюджет або оберіть рекомендацію.' : 'Add a budget or choose budget advice.';
    }
    if (targetStep === 3 && form.name.trim().length < 2) {
      nextErrors.name = locale === 'ua' ? 'Вкажіть ім’я.' : 'Add your name.';
    }
    if (targetStep === 3 && form.contact.trim().length < 3) {
      nextErrors.contact = locale === 'ua' ? 'Вкажіть контакт, за яким менеджер зможе вас знайти.' : 'Add a contact a manager can use to find you.';
    }
    if (targetStep === 3 && !form.consent) {
      nextErrors.consent = locale === 'ua' ? 'Потрібна згода на обробку даних.' : 'Consent is required.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function goNext() {
    if (validate()) setStep((value) => Math.min(3, value + 1));
  }

  async function submit() {
    if (![0, 1, 2, 3].every((index) => validate(index))) return;
    setStatus('submitting');
    try {
      const response = await fetch('/api/trip-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          locale,
          source,
          clientRequestId: `${Date.now()}-${crypto.randomUUID()}`,
        }),
      });
      if (!response.ok) throw new Error('delivery_failed');
      const payload = (await response.json()) as { ok?: boolean };
      if (!payload.ok) throw new Error('telegram_not_confirmed');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  const summary = useMemo(() => {
    const formatText = form.formats.join(', ') || '-';
    const dates = form.flexibleDates
      ? locale === 'ua'
        ? 'Дати гнучкі'
        : 'Flexible dates'
      : form.month || [form.startDate, form.endDate].filter(Boolean).join(' - ') || '-';
    const budget = form.needBudgetAdvice
      ? locale === 'ua'
        ? 'Потрібна рекомендація'
        : 'Needs advice'
      : `${form.budget || '-'} ${form.currency} / ${
          form.budgetType === 'total'
            ? locale === 'ua'
              ? 'на всю подорож'
              : 'total'
            : locale === 'ua'
              ? 'на одну особу'
              : 'per person'
        }`;
    return { formatText, dates, budget };
  }, [form, locale]);

  return (
    <>
      <Header locale={locale} setLocale={setLocale} />
      <main className="planner-page">
        <section className="planner-shell">
          <aside className="planner-aside">
            <p className="eyebrow">OBRII request</p>
            <h1>{labels.title}</h1>
            <p>{labels.intro}</p>
            {source.offerTitle && (
              <div className="source-offer">
                <span>{locale === 'ua' ? 'Обрана пропозиція' : 'Selected offer'}</span>
                <strong>{source.offerTitle}</strong>
              </div>
            )}
          </aside>
          <section className="planner-form" aria-live="polite">
            <Progress value={progress} className="planner-progress">
              <ProgressLabel>{labels.steps[step]}</ProgressLabel>
            </Progress>
            <div className="step-tabs" aria-label={locale === 'ua' ? 'Кроки форми' : 'Form steps'}>
              {labels.steps.map((label, index) => (
                <button key={label} className={cn(index === step && 'active')} type="button" onClick={() => setStep(index)}>
                  {index + 1}. {label}
                </button>
              ))}
            </div>
            <input className="honeypot" value={form.website} onChange={(event) => update('website', event.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" />

            {step === 0 && (
              <div className="form-step">
                <Field label={locale === 'ua' ? 'Напрям' : 'Destination'} error={errors.destination}>
                  <Input value={form.destination} onChange={(event) => update('destination', event.target.value)} placeholder={locale === 'ua' ? 'Країна, регіон або ваш опис' : 'Country, region or free text'} aria-invalid={Boolean(errors.destination)} />
                </Field>
                <CheckRow checked={form.undecided} onChange={(checked) => update('undecided', checked)} label={locale === 'ua' ? 'Ще не визначилися' : 'Not decided yet'} />
                <div>
                  <p className="field-label">{locale === 'ua' ? 'Формат подорожі' : 'Travel format'}</p>
                  <div className="choice-grid">
                    {tripFormats.map((format) => {
                      const label = format[locale];
                      const checked = form.formats.includes(label);
                      return (
                        <button
                          type="button"
                          className={cn('choice-pill', checked && 'selected')}
                          key={label}
                          onClick={() => update('formats', checked ? form.formats.filter((item) => item !== label) : [...form.formats, label])}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {errors.formats && <p className="field-error">{errors.formats}</p>}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="form-step">
                <div className="date-grid">
                  <Field label={locale === 'ua' ? 'Початок' : 'Start'}>
                    <Input type="date" value={form.startDate} onChange={(event) => update('startDate', event.target.value)} />
                  </Field>
                  <Field label={locale === 'ua' ? 'Завершення' : 'End'}>
                    <Input type="date" value={form.endDate} onChange={(event) => update('endDate', event.target.value)} />
                  </Field>
                </div>
                <Field label={locale === 'ua' ? 'Або орієнтовний місяць' : 'Or approximate month'} error={errors.dates}>
                  <Input value={form.month} onChange={(event) => update('month', event.target.value)} placeholder={locale === 'ua' ? 'Наприклад, лютий 2027' : 'For example, February 2027'} />
                </Field>
                <CheckRow checked={form.flexibleDates} onChange={(checked) => update('flexibleDates', checked)} label={locale === 'ua' ? 'Дати гнучкі' : 'Flexible dates'} />
                <div className="date-grid">
                  <Field label={locale === 'ua' ? 'Дорослі' : 'Adults'}>
                    <Input type="number" min={1} value={form.adults} onChange={(event) => update('adults', Math.max(1, Number(event.target.value)))} />
                  </Field>
                  <Field label={locale === 'ua' ? 'Діти' : 'Children'}>
                    <Input
                      type="number"
                      min={0}
                      value={form.children}
                      onChange={(event) => {
                        const count = Math.max(0, Number(event.target.value));
                        setForm((current) => ({ ...current, children: count, childAges: normalizeChildren(count, current.childAges) }));
                      }}
                    />
                  </Field>
                </div>
                {form.children > 0 && (
                  <div className="child-ages">
                    {form.childAges.map((age, index) => (
                      <Field key={`age-${index}`} label={`${locale === 'ua' ? 'Вік дитини' : 'Child age'} ${index + 1}`}>
                        <Input value={age} onChange={(event) => {
                          const ages = [...form.childAges];
                          ages[index] = event.target.value;
                          update('childAges', ages);
                        }} />
                      </Field>
                    ))}
                    {errors.childAges && <p className="field-error">{errors.childAges}</p>}
                  </div>
                )}
                <Field label={locale === 'ua' ? 'Місто або країна відправлення' : 'Departure city or country'}>
                  <Input value={form.departure} onChange={(event) => update('departure', event.target.value)} />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="form-step">
                <div className="budget-grid">
                  <Field label={locale === 'ua' ? 'Орієнтовний бюджет' : 'Approximate budget'} error={errors.budget}>
                    <Input type="number" min={0} value={form.budget} onChange={(event) => update('budget', event.target.value)} aria-invalid={Boolean(errors.budget)} />
                  </Field>
                  <Field label={locale === 'ua' ? 'Валюта' : 'Currency'}>
                    <NativeSelect value={form.currency} onChange={(event) => update('currency', event.target.value as PlannerState['currency'])} className="full-select">
                      <NativeSelectOption value="EUR">EUR</NativeSelectOption>
                      <NativeSelectOption value="USD">USD</NativeSelectOption>
                      <NativeSelectOption value="UAH">UAH</NativeSelectOption>
                    </NativeSelect>
                  </Field>
                </div>
                <div className="segmented">
                  <button type="button" className={cn(form.budgetType === 'total' && 'active')} onClick={() => update('budgetType', 'total')}>{locale === 'ua' ? 'На всю подорож' : 'Total trip'}</button>
                  <button type="button" className={cn(form.budgetType === 'person' && 'active')} onClick={() => update('budgetType', 'person')}>{locale === 'ua' ? 'На одну особу' : 'Per person'}</button>
                </div>
                <CheckRow checked={form.needBudgetAdvice} onChange={(checked) => update('needBudgetAdvice', checked)} label={locale === 'ua' ? 'Потрібна рекомендація щодо бюджету' : 'I need a budget recommendation'} />
                <Field label={locale === 'ua' ? 'Побажання до готелю, харчування, перельоту і сервісу' : 'Hotel, dining, flight and service wishes'}>
                  <Textarea value={form.wishes} onChange={(event) => update('wishes', event.target.value)} rows={6} />
                </Field>
              </div>
            )}

            {step === 3 && (
              <div className="form-step">
                <Field label={locale === 'ua' ? 'Ім’я' : 'Name'} error={errors.name}>
                  <Input value={form.name} onChange={(event) => update('name', event.target.value)} aria-invalid={Boolean(errors.name)} />
                </Field>
                <Field label={locale === 'ua' ? 'Бажаний спосіб зв’язку' : 'Preferred contact method'}>
                  <NativeSelect value={form.contactMethod} onChange={(event) => update('contactMethod', event.target.value as PlannerState['contactMethod'])} className="full-select">
                    <NativeSelectOption value="phone">{locale === 'ua' ? 'Телефон' : 'Phone'}</NativeSelectOption>
                    <NativeSelectOption value="telegram">Telegram</NativeSelectOption>
                    <NativeSelectOption value="whatsapp">WhatsApp</NativeSelectOption>
                    <NativeSelectOption value="email">Email</NativeSelectOption>
                  </NativeSelect>
                </Field>
                <Field label={locale === 'ua' ? 'Контакт для обраного способу' : 'Contact for selected method'} error={errors.contact}>
                  <Input value={form.contact} onChange={(event) => update('contact', event.target.value)} placeholder={form.contactMethod === 'telegram' ? '@username або номер телефону' : ''} aria-invalid={Boolean(errors.contact)} />
                </Field>
                {form.contactMethod === 'telegram' && <p className="field-help">{locale === 'ua' ? 'Менеджеру потрібен username або номер, за яким вас можна знайти в Telegram.' : 'A manager needs a username or phone number that can be found in Telegram.'}</p>}
                <Field label={locale === 'ua' ? 'Інші контакти' : 'Other contacts'}>
                  <Input value={form.otherContacts} onChange={(event) => update('otherContacts', event.target.value)} />
                </Field>
                <Field label={locale === 'ua' ? 'Зручний час зв’язку' : 'Convenient contact time'}>
                  <Input value={form.contactTime} onChange={(event) => update('contactTime', event.target.value)} />
                </Field>
                <div className="request-summary">
                  <h2>{locale === 'ua' ? 'Резюме заявки' : 'Request summary'}</h2>
                  <p><strong>{locale === 'ua' ? 'Напрям:' : 'Destination:'}</strong> {form.undecided ? (locale === 'ua' ? 'Ще не визначилися' : 'Not decided') : form.destination || '-'}</p>
                  <p><strong>{locale === 'ua' ? 'Формати:' : 'Formats:'}</strong> {summary.formatText}</p>
                  <p><strong>{locale === 'ua' ? 'Дати:' : 'Dates:'}</strong> {summary.dates}</p>
                  <p><strong>{locale === 'ua' ? 'Туристи:' : 'Travelers:'}</strong> {form.adults} + {form.children}</p>
                  <p><strong>{locale === 'ua' ? 'Бюджет:' : 'Budget:'}</strong> {summary.budget}</p>
                  {source.offerTitle && <p><strong>{locale === 'ua' ? 'Пропозиція:' : 'Offer:'}</strong> {source.offerTitle}</p>}
                </div>
                <CheckRow checked={form.consent} onChange={(checked) => update('consent', checked)} label={<>{locale === 'ua' ? 'Погоджуюся на обробку персональних даних згідно з ' : 'I agree to personal data processing under the '}<Link href="/privacy">{locale === 'ua' ? 'політикою конфіденційності' : 'privacy policy'}</Link></>} />
                {errors.consent && <p className="field-error">{errors.consent}</p>}
              </div>
            )}

            {status === 'success' && <div className="status success">{labels.success}</div>}
            {status === 'error' && <div className="status error">{labels.error}</div>}
            <div className="planner-actions">
              <Button type="button" variant="outline" className="obrii-outline" disabled={step === 0 || status === 'submitting'} onClick={() => setStep((value) => Math.max(0, value - 1))}>
                <ChevronLeft aria-hidden="true" /> {labels.back}
              </Button>
              {step < 3 ? (
                <Button type="button" className="obrii-button" onClick={goNext}>
                  {labels.next} <ChevronRight aria-hidden="true" />
                </Button>
              ) : (
                <Button type="button" className="obrii-button" disabled={status === 'submitting' || status === 'success'} onClick={submit}>
                  {status === 'submitting' ? labels.sending : status === 'error' ? labels.retry : labels.submit}
                  <Send aria-hidden="true" />
                </Button>
              )}
            </div>
          </section>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}

function cleanString(value: unknown, fallback: string) {
  return typeof value === 'string' ? value.slice(0, 600) : fallback;
}

function isCurrency(value: unknown): value is PlannerState['currency'] {
  return value === 'EUR' || value === 'USD' || value === 'UAH';
}

function isContactMethod(value: unknown): value is PlannerState['contactMethod'] {
  return value === 'phone' || value === 'telegram' || value === 'whatsapp' || value === 'email';
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
}) {
  return (
    <label className="check-row">
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(Boolean(value))} />
      <span>{label}</span>
    </label>
  );
}

export function CatalogPage() {
  const [locale, setLocale] = useState<Locale>('ua');
  const [visible, setVisible] = useState(6);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('lang') === 'en') setLocale('en');
  }, []);
  return (
    <>
      <Header locale={locale} setLocale={setLocale} />
      <main className="catalog-page">
        <section className="page-hero">
          <p className="eyebrow">Private collection</p>
          <h1>{locale === 'ua' ? 'Колекції подорожей' : 'Travel collections'}</h1>
          <p>{locale === 'ua' ? 'Демонстраційні історії для індивідуального підбору. Вони показують формат досвіду, а не гарантовану наявність.' : 'Demo stories for individual curation. They show the style of experience, not guaranteed availability.'}</p>
        </section>
        <section className="section">
          <div className="offer-grid">
            {offers.slice(0, visible).map((offer) => (
              <OfferCard key={offer.id} offer={offer} locale={locale} />
            ))}
          </div>
          {visible < offers.length && (
            <Button className="obrii-button centered-button" onClick={() => setVisible((value) => value + 3)}>
              {locale === 'ua' ? 'Показати ще' : 'Load more'}
            </Button>
          )}
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}

export function StaticPage({
  type,
}: {
  type: 'individual' | 'concierge' | 'about' | 'contacts' | 'privacy' | 'cookies' | 'terms';
}) {
  const [locale, setLocale] = useState<Locale>('ua');
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('lang') === 'en') setLocale('en');
  }, []);
  const pageCopy = {
    individual: {
      title: locale === 'ua' ? 'Індивідуальні подорожі' : 'Individual travel',
      text: locale === 'ua' ? 'Персональний travel-дизайнер збирає маршрут навколо ваших очікувань, ритму, складу подорожі та бюджету.' : 'A personal travel designer builds the route around your expectations, rhythm, travelers and budget.',
    },
    concierge: {
      title: 'Concierge',
      text: locale === 'ua' ? 'OBRII координує складові поїздки: авіацію, трансфери, вілли, яхти, ресторани, події, гідів і зміни маршруту.' : 'OBRII coordinates aviation, transfers, villas, yachts, restaurants, events, guides and route changes.',
    },
    about: {
      title: locale === 'ua' ? 'Про агенцію' : 'About OBRII',
      text: locale === 'ua' ? 'OBRII працює з приватними подорожами, concierge і подієвим туризмом. У центрі процесу людина, а не готовий пакет.' : 'OBRII works with private travel, concierge and event tourism. The process starts with the person, not a package.',
    },
    contacts: {
      title: locale === 'ua' ? 'Контакти' : 'Contacts',
      text: `${site.phone} · ${site.telegram} · ${site.email}`,
    },
    privacy: {
      title: locale === 'ua' ? 'Політика конфіденційності' : 'Privacy policy',
      text: locale === 'ua' ? 'Ця сторінка є заготовкою. Перед запуском потрібно додати юридично затверджений текст політики обробки персональних даних.' : 'This page is a draft. Add legally approved personal data processing text before launch.',
    },
    cookies: {
      title: 'Cookies',
      text: locale === 'ua' ? 'Аналітичні та маркетингові cookies мають вмикатися тільки після належної згоди користувача.' : 'Analytics and marketing cookies should be enabled only after proper user consent.',
    },
    terms: {
      title: locale === 'ua' ? 'Умови користування' : 'Terms of use',
      text: locale === 'ua' ? 'Ця сторінка є заготовкою для умов користування та юридичних реквізитів.' : 'This page is a draft for terms of use and legal details.',
    },
  }[type];
  return (
    <>
      <Header locale={locale} setLocale={setLocale} />
      <main className="simple-page">
        <section className="page-hero">
          <p className="eyebrow">OBRII</p>
          <h1>{pageCopy.title}</h1>
          <p>{pageCopy.text}</p>
          {type === 'about' && (
            <div className="owner-grid page-owner-grid">
              {owners.map((owner) => (
                <article className="owner-card" key={owner.name.ua}>
                  <img src={owner.image} alt={owner.name[locale]} />
                  <div>
                    <h3>{owner.name[locale]}</h3>
                    <p>{owner.role}</p>
                    <span>{owner.note[locale]}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
          {!['privacy', 'cookies', 'terms'].includes(type) && (
            <Link
              href={withLocale('/plan-your-trip', locale)}
              className="obrii-button cta-link"
            >
              {copy[locale].primaryCta}
            </Link>
          )}
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}

export function OfferDetailPage({ slug }: { slug: string }) {
  const offer = getOffer(slug);
  if (!offer) return null;
  return (
    <main className="offer-detail">
      <header className="detail-header">
        <Link href="/" className="brand detail-brand" aria-label="OBRII home">
          <img src="/assets/brand/logo.png" alt="OBRII" />
        </Link>
        <Link
          href={`/plan-your-trip?offer=${offer.slug}`}
          className="obrii-button cta-link"
        >
          Підібрати подорож
        </Link>
      </header>
      <section className="detail-hero">
        <img src={offer.image} alt={offer.title.ua} />
        <div>
          <p className="eyebrow">Демонстраційна пропозиція · {offer.id}</p>
          <h1>{offer.title.ua}</h1>
          <p>{offer.excerpt.ua}</p>
          <dl>
            <div>
              <MapPin aria-hidden="true" />
              <dt>Напрям</dt>
              <dd>{offer.destination.ua}</dd>
            </div>
            <div>
              <CalendarDays aria-hidden="true" />
              <dt>Тривалість</dt>
              <dd>{offer.duration.ua}</dd>
            </div>
            <div>
              <dt>Сезон</dt>
              <dd>{offer.season.ua}</dd>
            </div>
            <div>
              <dt>Формат</dt>
              <dd>{offer.format.ua}</dd>
            </div>
          </dl>
          <p className="demo-note">
            Це не підтверджена наявність і не пакетний тур. Менеджер OBRII
            збере схожий сценарій під ваші дати, склад подорожі та бюджет.
          </p>
          <Link
            href={`/plan-your-trip?offer=${offer.slug}`}
            className="obrii-button cta-link"
          >
            Створити схожу подорож
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
