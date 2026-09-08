'use client';

/* oxlint-disable nextjs/no-img-element, react/react-compiler */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { aboutPage, owners, type Locale } from '@/lib/content';
import { Footer, Header, OwnerPortrait } from '@/components/site';

function localized(path: string, locale: Locale) {
  return locale === 'en'
    ? `${path}${path.includes('?') ? '&' : '?'}lang=en`
    : path;
}

export function AboutPage() {
  const [locale, setLocale] = useState<Locale>('ua');
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('lang') === 'en')
      setLocale('en');
  }, []);

  return (
    <>
      <Header locale={locale} setLocale={setLocale} activePath="/about" />
      <main className="about-page">
        <section className="about-hero">
          <div className="about-hero-copy">
            <p className="eyebrow">{aboutPage.hero.eyebrow[locale]}</p>
            <h1>{aboutPage.hero.title[locale]}</h1>
            <p>{aboutPage.hero.description[locale]}</p>
            <a className="obrii-button" href="#team">
              {aboutPage.hero.cta[locale]} <ArrowRight aria-hidden="true" />
            </a>
          </div>
          <figure className="about-hero-media">
            <img
              src={aboutPage.hero.image}
              alt={aboutPage.hero.alt[locale]}
              style={{ objectPosition: aboutPage.hero.imagePosition }}
              fetchPriority="high"
            />
          </figure>
        </section>

        <section className="about-approach editorial-section">
          <h2>{aboutPage.approach.heading[locale]}</h2>
          <div>
            {aboutPage.approach.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph[locale]}</p>
            ))}
          </div>
        </section>

        <section className="about-team editorial-section" id="team">
          <header>
            <p className="eyebrow">OBRII TEAM</p>
            <h2>{aboutPage.teamHeading[locale]}</h2>
          </header>
          <div className="about-owner-grid">
            {owners.map((owner) => (
              <article className="about-owner" key={owner.name.ua}>
                <OwnerPortrait owner={owner} locale={locale} />
                <div className="about-owner-copy">
                  <h3>{owner.name[locale]}</h3>
                  <p className="about-owner-role">{owner.role[locale]}</p>
                  <p className="about-owner-note">{owner.note[locale]}</p>
                  <p>{owner.description[locale]}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="about-principles editorial-section">
          <header>
            <p className="eyebrow">ПІДХІД</p>
            <h2>{aboutPage.principles.heading[locale]}</h2>
          </header>
          <ol>
            {aboutPage.principles.items
              .filter((item) => item.visible)
              .sort((a, b) => a.order - b.order)
              .map((item, index) => (
                <li key={item.id}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <h3>{item.title[locale]}</h3>
                  <p>{item.description[locale]}</p>
                </li>
              ))}
          </ol>
        </section>

        <section className="about-final">
          <div>
            <h2>{aboutPage.finalCta.heading[locale]}</h2>
            <p>{aboutPage.finalCta.description[locale]}</p>
          </div>
          <div className="about-final-actions">
            <Link
              className="obrii-button"
              href={localized('/plan-your-trip', locale)}
            >
              {aboutPage.finalCta.primary[locale]}{' '}
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link
              className="about-secondary-link"
              href={localized('/contacts', locale)}
            >
              {aboutPage.finalCta.secondary[locale]}
            </Link>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  );
}
