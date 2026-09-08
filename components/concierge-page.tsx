'use client';

/* oxlint-disable react/react-compiler, nextjs/no-img-element */

import Link from 'next/link';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import { ArrowDown, ArrowRight, ChevronDown, Send } from 'lucide-react';
import { Footer, Header } from '@/components/site';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { conciergePage, site, type Locale } from '@/lib/content';
import { configuredContacts } from '@/lib/contact-links';
import { cn } from '@/lib/utils';

type ContactMethod = 'telegram' | 'phone' | 'whatsapp' | 'email';
type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

type ConciergeFormState = {
  serviceIds: string[];
  location: string;
  period: string;
  guests: string;
  budget: string;
  wishes: string;
  name: string;
  contactMethod: ContactMethod;
  contact: string;
  consent: boolean;
  website: string;
};

const initialForm: ConciergeFormState = {
  serviceIds: [],
  location: '',
  period: '',
  guests: '',
  budget: '',
  wishes: '',
  name: '',
  contactMethod: 'telegram',
  contact: '',
  consent: false,
  website: '',
};

const ui = {
  ua: {
    discuss: 'Обговорити запит',
    service: 'Яка послуга вас цікавить?',
    other: 'Інше',
    location: 'Країна / місто',
    locationPlaceholder: 'Наприклад: Італія, Майорка чи Київ',
    period: 'Бажана дата або період',
    periodPlaceholder: 'Можна вказати орієнтовно',
    guests: 'Кількість гостей',
    budget: 'Орієнтовний бюджет',
    budgetPlaceholder: 'Наприклад: до 3 000 EUR',
    wishes: 'Ваші побажання',
    wishesPlaceholder:
      'Наприклад: потрібна яхта на один день для 6 гостей на Майорці. Бажано з капітаном і обідом на борту.',
    name: 'Ваше ім’я',
    method: 'Як з вами зв’язатися?',
    contact: 'Контакт',
    consent: 'Погоджуюся на обробку персональних даних відповідно до',
    privacy: 'Політики конфіденційності',
    submit: 'Надіслати запит',
    submitting: 'Надсилаємо…',
    again: 'Надіслати ще один запит',
    serviceError: 'Оберіть хоча б одну послугу.',
    guestsError: 'Вкажіть кількість від 1 до 100.',
    wishesError: 'Опишіть побажання щонайменше кількома словами.',
    nameError: 'Вкажіть ваше ім’я.',
    contactError: 'Вкажіть контакт, за яким ми зможемо вас знайти.',
    consentError: 'Потрібна згода на обробку даних.',
  },
  en: {
    discuss: 'Discuss this request',
    service: 'Which service interests you?',
    other: 'Other',
    location: 'Country / city',
    locationPlaceholder: 'For example: Italy, Mallorca or Kyiv',
    period: 'Preferred date or period',
    periodPlaceholder: 'Approximate timing is fine',
    guests: 'Number of guests',
    budget: 'Approximate budget',
    budgetPlaceholder: 'For example: up to EUR 3,000',
    wishes: 'Your wishes',
    wishesPlaceholder:
      'For example: a yacht for one day for 6 guests in Mallorca, preferably with a captain and lunch on board.',
    name: 'Your name',
    method: 'How should we contact you?',
    contact: 'Contact',
    consent: 'I agree to the processing of personal data under the',
    privacy: 'Privacy policy',
    submit: 'Send request',
    submitting: 'Sending…',
    again: 'Send another request',
    serviceError: 'Choose at least one service.',
    guestsError: 'Enter a number from 1 to 100.',
    wishesError: 'Describe your wishes in a few words.',
    nameError: 'Enter your name.',
    contactError: 'Enter a contact we can use to reach you.',
    consentError: 'Consent to data processing is required.',
  },
};

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn('concierge-field', className)}>
      <span>{label}</span>
      {children}
      {error && <small role="alert">{error}</small>}
    </label>
  );
}

export function ConciergePage() {
  const [locale, setLocale] = useState<Locale>('ua');
  const [form, setForm] = useState<ConciergeFormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const [source, setSource] = useState<Record<string, string>>({});
  const requestId = useRef('');
  const labels = ui[locale];
  const telegramContact = configuredContacts(site).find(
    (contact) => contact.id === 'telegram',
  );

  const services = useMemo(
    () =>
      conciergePage.services.items
        .filter((item) => item.visible)
        .sort((a, b) => a.order - b.order),
    [],
  );
  const examples = useMemo(
    () =>
      conciergePage.examples.items
        .filter((item) => item.visible)
        .sort((a, b) => a.order - b.order),
    [],
  );
  const faqs = useMemo(
    () =>
      conciergePage.faq.items
        .filter((item) => item.visible)
        .sort((a, b) => a.order - b.order),
    [],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('lang') === 'en') setLocale('en');
    const nextSource: Record<string, string> = {
      page: window.location.href,
      referrer: document.referrer,
    };
    [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
    ].forEach((key) => {
      const value = params.get(key);
      if (value) nextSource[key] = value;
    });
    setSource(nextSource);
  }, []);

  function scrollToSection(id: string) {
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    document.getElementById(id)?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    });
  }

  function update<T extends keyof ConciergeFormState>(
    key: T,
    value: ConciergeFormState[T],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    if (status === 'error') setStatus('idle');
  }

  function selectAndOpen(serviceId: string) {
    setForm((current) => ({
      ...current,
      serviceIds: current.serviceIds.includes(serviceId)
        ? current.serviceIds
        : [...current.serviceIds, serviceId],
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next.serviceIds;
      return next;
    });
    scrollToSection('concierge-form');
  }

  function toggleService(serviceId: string) {
    update(
      'serviceIds',
      form.serviceIds.includes(serviceId)
        ? form.serviceIds.filter((id) => id !== serviceId)
        : [...form.serviceIds, serviceId],
    );
  }

  function validate() {
    const next: Record<string, string> = {};
    if (form.serviceIds.length === 0) next.serviceIds = labels.serviceError;
    if (
      form.guests &&
      (!Number.isInteger(Number(form.guests)) ||
        Number(form.guests) < 1 ||
        Number(form.guests) > 100)
    ) {
      next.guests = labels.guestsError;
    }
    if (form.wishes.trim().length < 10) next.wishes = labels.wishesError;
    if (form.name.trim().length < 2) next.name = labels.nameError;
    if (form.contact.trim().length < 3) next.contact = labels.contactError;
    if (!form.consent) next.consent = labels.consentError;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;
    if (!requestId.current) requestId.current = crypto.randomUUID();
    setStatus('submitting');
    try {
      const response = await fetch('/api/concierge-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          locale,
          source,
          clientRequestId: requestId.current,
        }),
      });
      const result = (await response.json()) as { ok?: boolean };
      if (!response.ok || !result.ok) throw new Error('delivery_failed');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  function resetForm() {
    setForm(initialForm);
    setErrors({});
    setStatus('idle');
    requestId.current = '';
  }

  return (
    <>
      <Header
        locale={locale}
        setLocale={setLocale}
        activePath="/concierge"
        ctaHref="#concierge-form"
        ctaLabel={conciergePage.hero.primaryCta[locale]}
      />
      <main className="concierge-page">
        <section className="concierge-hero" aria-labelledby="concierge-title">
          <img
            src={conciergePage.hero.image}
            alt={conciergePage.hero.alt[locale]}
            width="1536"
            height="1024"
            fetchPriority="high"
          />
          <div className="concierge-hero-shade" aria-hidden="true" />
          <div className="concierge-hero-copy">
            <p className="eyebrow">{conciergePage.hero.eyebrow[locale]}</p>
            <h1 id="concierge-title">{conciergePage.hero.title[locale]}</h1>
            <p>{conciergePage.hero.description[locale]}</p>
            <div className="concierge-hero-actions">
              <a
                className="obrii-button concierge-primary-link"
                href="#concierge-form"
              >
                {conciergePage.hero.primaryCta[locale]}
                <ArrowRight aria-hidden="true" />
              </a>
              <a className="concierge-secondary-link" href="#services">
                {conciergePage.hero.secondaryCta[locale]}
                <ArrowDown aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section
          className="concierge-section concierge-services"
          id="services"
          aria-labelledby="services-title"
        >
          <header className="concierge-section-heading">
            <div>
              <p className="eyebrow">
                {conciergePage.services.eyebrow[locale]}
              </p>
              <h2 id="services-title">
                {conciergePage.services.heading[locale]}
              </h2>
            </div>
            <p>{conciergePage.services.intro[locale]}</p>
          </header>
          <div className="concierge-service-grid">
            {services.map((service, index) => (
              <article className="concierge-service" key={service.id}>
                <div className="concierge-service-image">
                  <img
                    src={service.image}
                    alt={service.alt[locale]}
                    width="1536"
                    height="1024"
                    loading="lazy"
                    decoding="async"
                  />
                  <span aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="concierge-service-copy">
                  <h3>{service.title[locale]}</h3>
                  <p>{service.description[locale]}</p>
                  <button
                    type="button"
                    className="concierge-text-action"
                    onClick={() => selectAndOpen(service.id)}
                  >
                    {labels.discuss}
                    <ArrowRight aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          className="concierge-process"
          aria-labelledby="concierge-process-title"
        >
          <header>
            <p className="eyebrow">{conciergePage.process.eyebrow[locale]}</p>
            <h2 id="concierge-process-title">
              {conciergePage.process.heading[locale]}
            </h2>
          </header>
          <div className="concierge-process-grid">
            {conciergePage.process.steps.map((step) => (
              <article key={step.number}>
                <span>{step.number}</span>
                <h3>{step.title[locale]}</h3>
                <p>{step.description[locale]}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="concierge-section concierge-examples"
          aria-labelledby="concierge-examples-title"
        >
          <header className="concierge-section-heading">
            <div>
              <p className="eyebrow">
                {conciergePage.examples.eyebrow[locale]}
              </p>
              <h2 id="concierge-examples-title">
                {conciergePage.examples.heading[locale]}
              </h2>
            </div>
          </header>
          <div className="concierge-example-grid">
            {examples.map((example, index) => (
              <article key={example.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{example.title[locale]}</h3>
                <p>{example.text[locale]}</p>
              </article>
            ))}
          </div>
          <button
            type="button"
            className="concierge-other-action"
            onClick={() => selectAndOpen('other')}
          >
            {conciergePage.examples.otherCta[locale]}
            <ArrowRight aria-hidden="true" />
          </button>
        </section>

        <section
          className="concierge-request"
          id="concierge-form"
          aria-labelledby="concierge-form-title"
        >
          <div className="concierge-request-intro">
            <p className="eyebrow">{conciergePage.form.eyebrow[locale]}</p>
            <h2 id="concierge-form-title">
              {conciergePage.form.heading[locale]}
            </h2>
            <p>{conciergePage.form.intro[locale]}</p>
          </div>

          <div className="concierge-form-frame" aria-live="polite">
            {status === 'success' ? (
              <div className="concierge-success">
                <span aria-hidden="true">OBRII</span>
                <h3>{locale === 'ua' ? 'Запит надіслано' : 'Request sent'}</h3>
                <p>{conciergePage.form.success[locale]}</p>
                <Button
                  className="obrii-button"
                  type="button"
                  onClick={resetForm}
                >
                  {labels.again}
                </Button>
              </div>
            ) : (
              <form className="concierge-form" onSubmit={submit} noValidate>
                <input
                  className="honeypot"
                  value={form.website}
                  onChange={(event) => update('website', event.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />
                <fieldset
                  className="concierge-service-options concierge-span-two"
                  aria-describedby={
                    errors.serviceIds ? 'service-error' : undefined
                  }
                >
                  <legend>{labels.service}</legend>
                  <div>
                    {services.map((service) => {
                      const selected = form.serviceIds.includes(service.id);
                      return (
                        <button
                          key={service.id}
                          type="button"
                          aria-pressed={selected}
                          className={cn('choice-pill', selected && 'selected')}
                          onClick={() => toggleService(service.id)}
                        >
                          {service.title[locale]}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      aria-pressed={form.serviceIds.includes('other')}
                      className={cn(
                        'choice-pill',
                        form.serviceIds.includes('other') && 'selected',
                      )}
                      onClick={() => toggleService('other')}
                    >
                      {labels.other}
                    </button>
                  </div>
                  {errors.serviceIds && (
                    <small id="service-error" role="alert">
                      {errors.serviceIds}
                    </small>
                  )}
                </fieldset>

                <Field label={labels.location}>
                  <Input
                    value={form.location}
                    onChange={(event) => update('location', event.target.value)}
                    placeholder={labels.locationPlaceholder}
                    maxLength={160}
                  />
                </Field>
                <Field label={labels.period}>
                  <Input
                    value={form.period}
                    onChange={(event) => update('period', event.target.value)}
                    placeholder={labels.periodPlaceholder}
                    maxLength={120}
                  />
                </Field>
                <Field label={labels.guests} error={errors.guests}>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    inputMode="numeric"
                    value={form.guests}
                    onChange={(event) => update('guests', event.target.value)}
                    aria-invalid={Boolean(errors.guests)}
                  />
                </Field>
                <Field label={labels.budget}>
                  <Input
                    value={form.budget}
                    onChange={(event) => update('budget', event.target.value)}
                    placeholder={labels.budgetPlaceholder}
                    maxLength={100}
                  />
                </Field>
                <Field
                  label={labels.wishes}
                  error={errors.wishes}
                  className="concierge-span-two"
                >
                  <Textarea
                    value={form.wishes}
                    onChange={(event) => update('wishes', event.target.value)}
                    placeholder={labels.wishesPlaceholder}
                    rows={6}
                    maxLength={1600}
                    aria-invalid={Boolean(errors.wishes)}
                  />
                </Field>
                <Field label={labels.name} error={errors.name}>
                  <Input
                    value={form.name}
                    onChange={(event) => update('name', event.target.value)}
                    maxLength={80}
                    autoComplete="name"
                    aria-invalid={Boolean(errors.name)}
                  />
                </Field>
                <Field label={labels.method}>
                  <NativeSelect
                    value={form.contactMethod}
                    onChange={(event) =>
                      update(
                        'contactMethod',
                        event.target.value as ContactMethod,
                      )
                    }
                    className="full-select"
                  >
                    <NativeSelectOption value="telegram">
                      Telegram
                    </NativeSelectOption>
                    <NativeSelectOption value="phone">
                      {locale === 'ua' ? 'Телефон' : 'Phone'}
                    </NativeSelectOption>
                    <NativeSelectOption value="whatsapp">
                      WhatsApp
                    </NativeSelectOption>
                    <NativeSelectOption value="email">Email</NativeSelectOption>
                  </NativeSelect>
                </Field>
                <Field
                  label={labels.contact}
                  error={errors.contact}
                  className="concierge-span-two"
                >
                  <Input
                    type={form.contactMethod === 'email' ? 'email' : 'text'}
                    inputMode={
                      form.contactMethod === 'email'
                        ? 'email'
                        : form.contactMethod === 'telegram'
                          ? 'text'
                          : 'tel'
                    }
                    value={form.contact}
                    onChange={(event) => update('contact', event.target.value)}
                    placeholder={
                      form.contactMethod === 'telegram'
                        ? '@username або +380…'
                        : form.contactMethod === 'email'
                          ? 'name@example.com'
                          : '+380…'
                    }
                    maxLength={120}
                    autoComplete={
                      form.contactMethod === 'email' ? 'email' : 'tel'
                    }
                    aria-invalid={Boolean(errors.contact)}
                  />
                </Field>
                <label className="concierge-consent concierge-span-two">
                  <Checkbox
                    checked={form.consent}
                    onCheckedChange={(value) =>
                      update('consent', Boolean(value))
                    }
                    aria-invalid={Boolean(errors.consent)}
                  />
                  <span>
                    {labels.consent}{' '}
                    <Link href="/privacy">{labels.privacy}</Link>.
                  </span>
                </label>
                {errors.consent && (
                  <small
                    className="concierge-form-error concierge-span-two"
                    role="alert"
                  >
                    {errors.consent}
                  </small>
                )}
                {status === 'error' && (
                  <div
                    className="concierge-delivery-error concierge-span-two"
                    role="alert"
                  >
                    <p>
                      {telegramContact
                        ? conciergePage.form.error[locale]
                        : locale === 'ua'
                          ? 'Не вдалося надіслати запит. Спробуйте ще раз пізніше.'
                          : 'The request could not be sent. Please try again later.'}
                    </p>
                    {telegramContact && (
                      <a
                        href={telegramContact.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Telegram {telegramContact.value}
                      </a>
                    )}
                  </div>
                )}
                <div className="concierge-submit concierge-span-two">
                  <Button
                    className="obrii-button"
                    type="submit"
                    disabled={status === 'submitting'}
                  >
                    {status === 'submitting'
                      ? labels.submitting
                      : labels.submit}
                    <Send aria-hidden="true" />
                  </Button>
                  <p>{conciergePage.form.note[locale]}</p>
                </div>
              </form>
            )}
          </div>
        </section>

        <section
          className="concierge-section concierge-faq"
          aria-labelledby="concierge-faq-title"
        >
          <header>
            <p className="eyebrow">{conciergePage.faq.eyebrow[locale]}</p>
            <h2 id="concierge-faq-title">
              {conciergePage.faq.heading[locale]}
            </h2>
          </header>
          <div className="concierge-faq-list">
            {faqs.map((faq) => (
              <details key={faq.id}>
                <summary>
                  <span>{faq.question[locale]}</span>
                  <ChevronDown aria-hidden="true" />
                </summary>
                <p>{faq.answer[locale]}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
