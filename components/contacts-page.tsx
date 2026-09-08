'use client';
/* oxlint-disable react/react-compiler */

import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Clock3,
  ExternalLink,
  Mail,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { contactsPage, site, type Locale } from '@/lib/content';
import { configuredContacts, safeSocialHref } from '@/lib/contact-links';
import { contactMethods, contactTopics } from '@/lib/contact-request';
import { Footer, Header } from '@/components/site';

type Fields = {
  name: string;
  topic: string;
  contactMethod: string;
  contact: string;
  message: string;
  consent: boolean;
  website: string;
};
const initial: Fields = {
  name: '',
  topic: '',
  contactMethod: 'telegram',
  contact: '',
  message: '',
  consent: false,
  website: '',
};
const icons = {
  phone: Phone,
  telegram: MessageCircle,
  whatsapp: MessageCircle,
  email: Mail,
};

function localized(path: string, locale: Locale) {
  return locale === 'en'
    ? `${path}${path.includes('?') ? '&' : '?'}lang=en`
    : path;
}

export function ContactsPage() {
  const [locale, setLocale] = useState<Locale>('ua');
  const [fields, setFields] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const requestId = useRef(crypto.randomUUID());
  const contacts = configuredContacts(site);
  const socials = [
    { label: 'Instagram', href: safeSocialHref(site.instagram) },
    { label: 'Facebook', href: safeSocialHref(site.facebook) },
  ].filter((item) => item.href);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('lang') === 'en')
      setLocale('en');
  }, []);

  function update<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
    if (status === 'error') setStatus('idle');
  }

  function validate() {
    const next: Record<string, string> = {};
    if (fields.name.trim().length < 2) next.name = 'Вкажіть ваше ім’я.';
    if (!(fields.topic in contactTopics))
      next.topic = 'Оберіть тему звернення.';
    if (!(fields.contactMethod in contactMethods))
      next.contactMethod = 'Оберіть спосіб зв’язку.';
    const contact = fields.contact.trim();
    if (!contact) next.contact = 'Вкажіть контакт для відповіді.';
    else if (
      fields.contactMethod === 'email' &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)
    )
      next.contact = 'Перевірте адресу електронної пошти.';
    else if (
      (fields.contactMethod === 'phone' ||
        fields.contactMethod === 'whatsapp') &&
      !/^\d{7,15}$/.test(contact.replace(/\D/g, ''))
    )
      next.contact = 'Вкажіть номер із кодом країни.';
    else if (
      fields.contactMethod === 'telegram' &&
      !(
        /^@[A-Za-z0-9_]{5,32}$/.test(contact) ||
        /^https:\/\/(t\.me|telegram\.me)\/[A-Za-z0-9_]{5,32}\/?$/.test(contact)
      )
    )
      next.contact = 'Вкажіть @username або посилання t.me.';
    if (fields.message.trim().length < 10)
      next.message = 'Опишіть запит щонайменше у 10 символах.';
    if (!fields.consent) next.consent = 'Потрібна згода на обробку даних.';
    setErrors(next);
    return next;
  }

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'loading') return;
    const next = validate();
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    setStatus('loading');
    const params = new URLSearchParams(window.location.search);
    const source = Object.fromEntries(
      [...params].filter(([key]) => key.startsWith('utm_')).slice(0, 5),
    );
    source.page = window.location.pathname;
    try {
      const response = await fetch('/api/contact-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...fields,
          clientRequestId: requestId.current,
          source,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        errors?: Record<string, string>;
      };
      if (!response.ok || !result.ok) {
        if (result.errors)
          setErrors(
            Object.fromEntries(
              Object.keys(result.errors).map((key) => [
                key,
                'Перевірте це поле.',
              ]),
            ),
          );
        setStatus('error');
        return;
      }
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  const inputMode =
    fields.contactMethod === 'email'
      ? 'email'
      : fields.contactMethod === 'phone' || fields.contactMethod === 'whatsapp'
        ? 'tel'
        : 'text';
  const errorText = contacts.length
    ? 'Не вдалося надіслати повідомлення. Спробуйте ще раз або скористайтеся контактами поруч.'
    : 'Не вдалося надіслати повідомлення. Спробуйте ще раз пізніше.';

  return (
    <>
      <Header locale={locale} setLocale={setLocale} activePath="/contacts" />
      <main className="contacts-page">
        <header className="contacts-intro">
          <p className="eyebrow">{contactsPage.hero.eyebrow[locale]}</p>
          <h1>{contactsPage.hero.title[locale]}</h1>
          <p>{contactsPage.hero.description[locale]}</p>
        </header>

        <div className="contacts-layout">
          <section
            className="contact-methods"
            aria-labelledby="contact-methods-title"
          >
            <h2 id="contact-methods-title">
              {locale === 'ua'
                ? 'Зручний спосіб зв’язку'
                : 'Choose how to contact us'}
            </h2>
            {contacts.length > 0 && (
              <div className="contact-link-list">
                {contacts.map((contact) => {
                  const Icon = icons[contact.id];
                  return (
                    <a
                      key={contact.id}
                      href={contact.href}
                      target={
                        contact.id === 'phone' || contact.id === 'email'
                          ? undefined
                          : '_blank'
                      }
                      rel="noreferrer"
                    >
                      <Icon aria-hidden="true" />
                      <span>
                        <small>{contact.label}</small>
                        {contact.value}
                      </span>
                      <ArrowRight aria-hidden="true" />
                    </a>
                  );
                })}
              </div>
            )}
            <div className="contact-online">
              <MessageCircle aria-hidden="true" />
              <div>
                <h3>{contactsPage.online.heading[locale]}</h3>
                <p>{contactsPage.online.text[locale]}</p>
              </div>
            </div>
            {site.workingHours[locale].trim() && (
              <div className="contact-detail">
                <Clock3 aria-hidden="true" />
                <div>
                  <small>Години роботи</small>
                  <p>{site.workingHours[locale]}</p>
                </div>
              </div>
            )}
            {socials.length > 0 && (
              <div className="contact-socials">
                {socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {social.label}
                    <ExternalLink aria-hidden="true" />
                  </a>
                ))}
              </div>
            )}
          </section>

          <section
            className="contact-form-section"
            aria-labelledby="contact-form-title"
          >
            <header>
              <p className="eyebrow">ЗВЕРНЕННЯ</p>
              <h2 id="contact-form-title">
                {contactsPage.form.heading[locale]}
              </h2>
              <p>{contactsPage.form.description[locale]}</p>
            </header>
            {status === 'success' ? (
              <output className="contact-success">
                <span>✓</span>
                <p>
                  Дякуємо! Ваше повідомлення передано команді OBRII. Відповімо
                  за вказаним контактом.
                </p>
                <Link href={localized('/', locale)}>
                  На головну <ArrowRight aria-hidden="true" />
                </Link>
              </output>
            ) : (
              <form className="contact-form" onSubmit={submit} noValidate>
                <label>
                  <span>Ваше ім’я</span>
                  <input
                    name="name"
                    autoComplete="name"
                    maxLength={80}
                    value={fields.name}
                    onChange={(e) => update('name', e.target.value)}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={
                      errors.name ? 'contact-name-error' : undefined
                    }
                  />
                  {errors.name && (
                    <small id="contact-name-error">{errors.name}</small>
                  )}
                </label>
                <label>
                  <span>Тема звернення</span>
                  <select
                    name="topic"
                    value={fields.topic}
                    onChange={(e) => update('topic', e.target.value)}
                    aria-invalid={Boolean(errors.topic)}
                    aria-describedby={
                      errors.topic ? 'contact-topic-error' : undefined
                    }
                  >
                    <option value="">Оберіть тему</option>
                    {Object.entries(contactTopics).map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {errors.topic && (
                    <small id="contact-topic-error">{errors.topic}</small>
                  )}
                </label>
                <fieldset className="contact-method-choice">
                  <legend>Як з вами зв’язатися?</legend>
                  <div>
                    {Object.entries(contactMethods).map(([id, label]) => (
                      <label key={id}>
                        <input
                          type="radio"
                          name="contactMethod"
                          value={id}
                          checked={fields.contactMethod === id}
                          onChange={(e) =>
                            update('contactMethod', e.target.value)
                          }
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label>
                  <span>Контакт</span>
                  <input
                    name="contact"
                    type={inputMode === 'email' ? 'email' : 'text'}
                    inputMode={inputMode}
                    autoComplete={
                      inputMode === 'email'
                        ? 'email'
                        : inputMode === 'tel'
                          ? 'tel'
                          : 'off'
                    }
                    maxLength={120}
                    value={fields.contact}
                    onChange={(e) => update('contact', e.target.value)}
                    aria-invalid={Boolean(errors.contact)}
                    aria-describedby={
                      errors.contact ? 'contact-value-error' : undefined
                    }
                    placeholder={
                      fields.contactMethod === 'telegram'
                        ? '@username'
                        : fields.contactMethod === 'email'
                          ? 'name@example.com'
                          : '+380…'
                    }
                  />
                  {errors.contact && (
                    <small id="contact-value-error">{errors.contact}</small>
                  )}
                </label>
                <label>
                  <span>Повідомлення</span>
                  <textarea
                    name="message"
                    rows={6}
                    maxLength={2000}
                    value={fields.message}
                    onChange={(e) => update('message', e.target.value)}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={
                      errors.message ? 'contact-message-error' : undefined
                    }
                    placeholder="Коротко опишіть, чим ми можемо допомогти."
                  />
                  {errors.message && (
                    <small id="contact-message-error">{errors.message}</small>
                  )}
                </label>
                <label className="contact-honeypot" aria-hidden="true">
                  Сайт
                  <input
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={fields.website}
                    onChange={(e) => update('website', e.target.value)}
                  />
                </label>
                <label className="contact-consent">
                  <input
                    type="checkbox"
                    checked={fields.consent}
                    onChange={(e) => update('consent', e.target.checked)}
                    aria-invalid={Boolean(errors.consent)}
                    aria-describedby={
                      errors.consent ? 'contact-consent-error' : undefined
                    }
                  />
                  <span>
                    Погоджуюся на обробку персональних даних відповідно до{' '}
                    <Link href={localized('/privacy', locale)}>
                      Політики конфіденційності
                    </Link>
                    .
                  </span>
                </label>
                {errors.consent && (
                  <small
                    id="contact-consent-error"
                    className="contact-field-error"
                  >
                    {errors.consent}
                  </small>
                )}
                <div className="contact-submit">
                  <button
                    className="obrii-button"
                    type="submit"
                    disabled={status === 'loading'}
                  >
                    {status === 'loading'
                      ? 'Надсилаємо…'
                      : 'Надіслати повідомлення'}{' '}
                    <ArrowRight aria-hidden="true" />
                  </button>
                  <p>
                    Уже знаєте побажання до подорожі?{' '}
                    <Link href={localized('/plan-your-trip', locale)}>
                      Заповніть детальний запит
                    </Link>
                    .
                  </p>
                </div>
                <div className="contact-status" aria-live="polite">
                  {status === 'error' && <p>{errorText}</p>}
                </div>
              </form>
            )}
          </section>
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
}
