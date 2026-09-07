export type Locale = 'ua' | 'en';

export const site = {
  name: 'OBRII',
  phone: '+38 000 000 00 00',
  telegram: '@obrii_travel',
  whatsapp: '+38 000 000 00 00',
  email: 'hello@obrii.travel',
};

export const heroPanels = [
  {
    id: 'beach',
    image: '/assets/hero/beach.png',
    alt: {
      ua: 'Приватний пляж із білим піском і лазурним морем',
      en: 'Private white sand beach with turquoise sea',
    },
  },
  {
    id: 'mountain',
    image: '/assets/hero/mountain.png',
    alt: {
      ua: 'Сучасне шале з infinity pool у горах',
      en: 'Modern mountain chalet with an infinity pool',
    },
  },
  {
    id: 'events',
    image: '/assets/hero/events.png',
    alt: {
      ua: 'Автоспортивна подія з VIP-hospitality тераси',
      en: 'Motorsport event from a VIP hospitality terrace',
    },
  },
];

export const owners = [
  {
    name: { ua: 'Безрук Владислав', en: 'Vladyslav Bezruk' },
    role: { ua: 'Співвласник', en: 'Co-owner' },
    note: { ua: '10+ років у туристичній сфері', en: '10+ years in travel' },
    image: '/assets/team/vladyslav-bezruk.jpg',
    holidayImage: '/assets/team/vladyslav-bezruk-holiday.webp',
    imagePosition: '50% 50%',
    holidayImagePosition: '50% 50%',
  },
  {
    name: { ua: 'Булаєнко Миколай', en: 'Mykolai Bulaienko' },
    role: { ua: 'Співвласник', en: 'Co-owner' },
    note: { ua: '15+ років в IT-сфері', en: '15+ years in IT' },
    image: '/assets/team/mykolai-bulaienko.jpg',
    holidayImage: '/assets/team/mykolai-bulaienko-holiday.webp',
    imagePosition: '50% 42%',
    holidayImagePosition: '50% 44%',
  },
];

export const tripFormats = [
  { ua: 'Пляжний відпочинок', en: 'Beach escapes' },
  { ua: 'Гори', en: 'Mountains' },
  { ua: 'Сімейний', en: 'Family' },
  { ua: 'Романтичний', en: 'Romantic' },
  { ua: 'Wellness', en: 'Wellness' },
  { ua: 'Гастрономічний', en: 'Gastronomy' },
  { ua: 'Яхти та вілли', en: 'Yachts and villas' },
  { ua: 'Подієвий', en: 'Events' },
  { ua: 'Інше', en: 'Other' },
];

export const offers = [
  {
    id: 'OBRII-DEMO-001',
    slug: 'private-villa-como',
    featured: true,
    order: 1,
    title: {
      ua: 'Тиждень на приватній віллі на Комо',
      en: 'A Week at a Private Villa on Como',
    },
    destination: { ua: 'Італія, Ломбардія', en: 'Italy, Lombardy' },
    format: { ua: 'Яхти та вілли', en: 'Yachts and villas' },
    season: { ua: 'Травень - жовтень', en: 'May - October' },
    duration: { ua: '7-10 днів', en: '7-10 days' },
    image: '/assets/offers/como-villa.png',
    excerpt: {
      ua: 'Приватний ритм озера, резиденція з сервісом і делікатна логістика для сімейної або камерної подорожі.',
      en: 'A private lake rhythm, serviced residence and discreet logistics for a family or intimate escape.',
    },
  },
  {
    id: 'OBRII-DEMO-002',
    slug: 'iceland-winter-private-guide',
    featured: true,
    order: 2,
    title: {
      ua: 'Зимова Ісландія з персональним гідом',
      en: 'Winter Iceland with a Private Guide',
    },
    destination: { ua: 'Ісландія', en: 'Iceland' },
    format: { ua: 'Сафарі та експедиції', en: 'Expeditions' },
    season: { ua: 'Листопад - березень', en: 'November - March' },
    duration: { ua: '6-9 днів', en: '6-9 days' },
    image: '/assets/offers/iceland-private-guide.png',
    excerpt: {
      ua: 'Маршрут із резервними сценаріями, приватними трансферами та зупинками у місцях, де важлива тиша.',
      en: 'A route with backup scenarios, private transfers and quiet stops where timing matters.',
    },
  },
  {
    id: 'OBRII-DEMO-003',
    slug: 'gastronomic-japan',
    featured: true,
    order: 3,
    title: { ua: 'Гастрономічна Японія', en: 'Gastronomic Japan' },
    destination: {
      ua: 'Токіо, Кіото, Канадзава',
      en: 'Tokyo, Kyoto, Kanazawa',
    },
    format: { ua: 'Гастрономічний', en: 'Gastronomy' },
    season: { ua: 'Весна або осінь', en: 'Spring or autumn' },
    duration: { ua: '10-14 днів', en: '10-14 days' },
    image: '/assets/offers/gastronomic-japan.png',
    excerpt: {
      ua: 'Резервації, локальні експерти й маршрут без зайвого поспіху навколо культури смаку.',
      en: 'Reservations, local experts and a measured route around the culture of taste.',
    },
  },
  {
    id: 'OBRII-DEMO-004',
    slug: 'seychelles-private-yacht',
    featured: true,
    order: 4,
    title: {
      ua: 'Приватна яхта на Сейшелах',
      en: 'Private Yacht in the Seychelles',
    },
    destination: { ua: 'Сейшели', en: 'Seychelles' },
    format: { ua: 'Яхти та вілли', en: 'Yachts and villas' },
    season: { ua: 'Квітень - листопад', en: 'April - November' },
    duration: { ua: '7-12 днів', en: '7-12 days' },
    image: '/assets/offers/seychelles-yacht.png',
    excerpt: {
      ua: 'Острови, екіпаж, приватний шеф і берегові зупинки, узгоджені під темп гостей.',
      en: 'Islands, crew, private chef and shore stops arranged around the guests’ pace.',
    },
  },
  {
    id: 'OBRII-DEMO-005',
    slug: 'wellness-alpine-retreat',
    featured: true,
    order: 5,
    title: { ua: 'Wellness-retreat в Альпах', en: 'Alpine Wellness Retreat' },
    destination: { ua: 'Альпи', en: 'The Alps' },
    format: { ua: 'Wellness', en: 'Wellness' },
    season: { ua: 'Цілий рік', en: 'Year-round' },
    duration: { ua: '5-8 днів', en: '5-8 days' },
    image: '/assets/offers/alpine-wellness.png',
    excerpt: {
      ua: 'Відновлення, тиха архітектура, персональні практики та трансфери без зайвих контактів.',
      en: 'Recovery, quiet architecture, personal practices and low-friction transfers.',
    },
  },
  {
    id: 'OBRII-DEMO-006',
    slug: 'vip-sport-weekend',
    featured: true,
    order: 6,
    title: {
      ua: 'VIP-вікенд на спортивній події',
      en: 'VIP Weekend at a Sporting Event',
    },
    destination: { ua: 'Європа', en: 'Europe' },
    format: { ua: 'Подієвий', en: 'Events' },
    season: { ua: 'За календарем подій', en: 'By event calendar' },
    duration: { ua: '3-5 днів', en: '3-5 days' },
    image: '/assets/offers/vip-sport-weekend.png',
    excerpt: {
      ua: 'Hospitality-доступ, проживання, трансфери та приватна програма навколо головної події.',
      en: 'Hospitality access, stays, transfers and a private program around the main event.',
    },
  },
  {
    id: 'OBRII-DEMO-007',
    slug: 'family-mediterranean-summer',
    featured: false,
    order: 7,
    title: {
      ua: 'Сімейне літо на Середземному морі',
      en: 'Family Summer on the Mediterranean',
    },
    destination: { ua: 'Середземномор’я', en: 'Mediterranean' },
    format: { ua: 'Сімейний', en: 'Family' },
    season: { ua: 'Червень - вересень', en: 'June - September' },
    duration: { ua: '10-14 днів', en: '10-14 days' },
    image: '/assets/offers/family-mediterranean.png',
    excerpt: {
      ua: 'Спокійні пляжі, перевірені готелі, дитяча логістика та резервні плани для погоди.',
      en: 'Calm beaches, trusted hotels, child-friendly logistics and weather backup plans.',
    },
  },
  {
    id: 'OBRII-DEMO-008',
    slug: 'executive-travel-europe',
    featured: false,
    order: 8,
    title: {
      ua: 'Executive travel для приватної групи',
      en: 'Executive Travel for a Private Group',
    },
    destination: { ua: 'Європа', en: 'Europe' },
    format: { ua: 'Business travel', en: 'Business travel' },
    season: { ua: 'За запитом', en: 'On request' },
    duration: { ua: '2-6 днів', en: '2-6 days' },
    image: '/assets/offers/executive-travel.png',
    excerpt: {
      ua: 'Перельоти, проживання, зустрічі, вечері й супровід для команди або партнерів.',
      en: 'Flights, stays, meetings, dinners and support for a team or partners.',
    },
  },
];

export const copy = {
  ua: {
    nav: ['Подорожі', 'Консьєрж', 'Колекції', 'Про нас', 'Журнал'],
    heroTitle: 'Подорожі, створені навколо вас',
    heroText:
      'Від першої ідеї до повернення додому персонально плануємо маршрут і беремо на себе кожну деталь.',
    primaryCta: 'Підібрати подорож',
    secondaryCta: 'Познайомитися з сервісом',
    selectedTrips: 'Актуальні подорожі',
    demoNotice:
      'Демонстраційний контент. Доступність і бюджет уточнюються менеджером.',
    collectionLink: 'Увесь каталог',
    similar: 'Створити схожу подорож',
    manifestTitle: 'Ми не починаємо з каталогу. Ми починаємо з людини.',
    manifest:
      'OBRII створює індивідуальні подорожі для тих, хто цінує час, приватність і впевненість у деталях. Ви описуєте бажаний досвід, а команда збирає маршрут, логістику, бронювання та супровід у єдину спокійну систему.',
    formatsTitle: 'Формати подорожей',
    workTitle: 'Як ми працюємо',
    conciergeTitle: 'Concierge',
    ownersTitle: 'Співвласники',
    finalTitle: 'Розкажіть, якою ви уявляєте наступну подорож',
    finalText:
      'Форма збере ключові побажання, а менеджер OBRII повернеться з уточненнями для персонального підбору.',
  },
  en: {
    nav: ['Travel', 'Concierge', 'Collections', 'About', 'Stories'],
    heroTitle: 'Journeys arranged around you',
    heroText:
      'From the first idea to the return home, we plan the route personally and take care of every detail.',
    primaryCta: 'Plan your trip',
    secondaryCta: 'Explore service',
    selectedTrips: 'Private collection',
    demoNotice:
      'Demo content. Availability and budget are confirmed by a manager.',
    collectionLink: 'Full catalog',
    similar: 'Create a similar trip',
    manifestTitle: 'We do not start with a catalog. We start with the person.',
    manifest:
      'OBRII creates individual journeys for people who value time, privacy and confidence in the details. You describe the desired experience, and the team assembles route, logistics, reservations and support into one calm system.',
    formatsTitle: 'Travel formats',
    workTitle: 'How we work',
    conciergeTitle: 'Concierge',
    ownersTitle: 'Co-owners',
    finalTitle: 'Tell us what your next journey should feel like',
    finalText:
      'The form captures the essentials, then an OBRII manager follows up to refine a personal proposal.',
  },
};

export const workSteps = {
  ua: [
    [
      'Знайомство',
      'Визначаємо очікування, склад подорожі, бюджет і важливі деталі.',
    ],
    ['Концепція', 'Пропонуємо один або кілька сценаріїв.'],
    ['Організація', 'Бронюємо і координуємо всі складові.'],
    ['Супровід', 'Залишаємося на зв’язку до повернення додому.'],
  ],
  en: [
    ['Discovery', 'We define expectations, travelers, budget and details.'],
    ['Concept', 'We propose one or several scenarios.'],
    ['Arrangements', 'We book and coordinate every component.'],
    ['Support', 'We stay in touch until you return home.'],
  ],
};

export const conciergeItems = {
  ua: [
    'приватна авіація та VIP-сервіси в аеропортах',
    'трансфери й оренда автомобілів',
    'вілли, яхти та резиденції',
    'ресторани й закриті події',
    'персональні гіди',
    'організація особливих подій',
    'підтримка і зміни маршруту',
  ],
  en: [
    'private aviation and VIP airport services',
    'transfers and car rental',
    'villas, yachts and residences',
    'restaurants and private events',
    'personal guides',
    'special event arrangements',
    'route changes and on-trip support',
  ],
};

export function getOffer(slug: string) {
  return offers.find((offer) => offer.slug === slug);
}
