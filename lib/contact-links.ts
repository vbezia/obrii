export type ContactLink = {
  id: 'phone' | 'telegram' | 'whatsapp' | 'email';
  label: string;
  value: string;
  href: string;
};

function phoneDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function validPhone(value: string) {
  const digits = phoneDigits(value);
  return (
    digits.length >= 7 && digits.length <= 15 && !/^0+$/.test(digits.slice(-7))
  );
}

export function telegramHref(value: string) {
  const trimmed = value.trim();
  if (/^@[A-Za-z0-9_]{5,32}$/.test(trimmed)) {
    return `https://t.me/${trimmed.slice(1)}`;
  }
  try {
    const url = new URL(trimmed);
    if (
      url.protocol === 'https:' &&
      ['t.me', 'telegram.me'].includes(url.hostname) &&
      /^\/[A-Za-z0-9_]{5,32}\/?$/.test(url.pathname)
    ) {
      return url.href;
    }
  } catch {}
  return '';
}

export function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function safeSocialHref(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && !url.username && !url.password
      ? url.href
      : '';
  } catch {
    return '';
  }
}

export function configuredContacts(site: {
  phone: string;
  telegram: string;
  whatsapp: string;
  email: string;
}): ContactLink[] {
  const links: ContactLink[] = [];
  if (validPhone(site.phone))
    links.push({
      id: 'phone',
      label: 'Телефон',
      value: site.phone.trim(),
      href: `tel:+${phoneDigits(site.phone)}`,
    });
  const telegram = telegramHref(site.telegram);
  if (telegram)
    links.push({
      id: 'telegram',
      label: 'Telegram',
      value: site.telegram.trim(),
      href: telegram,
    });
  if (validPhone(site.whatsapp))
    links.push({
      id: 'whatsapp',
      label: 'WhatsApp',
      value: site.whatsapp.trim(),
      href: `https://wa.me/${phoneDigits(site.whatsapp)}`,
    });
  if (validEmail(site.email))
    links.push({
      id: 'email',
      label: 'Email',
      value: site.email.trim(),
      href: `mailto:${site.email.trim()}`,
    });
  return links;
}
