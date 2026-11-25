// Карточка ссылки (og:image) и иконки сайта: имена файлов и размеры.
// Общий источник для Base.astro (meta-теги), scripts/og.mjs и scripts/icons.mjs (рисуют и проверяют картинки)
// и scripts/shots.mjs (проверяет теги на собранном сайте). Как устроено — docs/wiki/seo.md.
//
// Файл читают и скрипты Node напрямую (без сборки), поэтому здесь нет импортов и import.meta.env.

/** Размер карточки ссылки — 1200×630 (макет docs/design/og/). */
export const ogImageSize = { width: 1200, height: 630 } as const;

/** Карточка ссылки страницы — путь от public/: главная — og/home.png, кейс — og/<slug>.png. */
export function ogImagePath(slug?: string): string {
  return slug ? `og/${slug}.png` : 'og/home.png';
}

export interface SiteIcon {
  /** rel ссылки в <head>: icon — вкладка браузера, apple-touch-icon — значок на экране телефона. */
  rel: 'icon' | 'apple-touch-icon';
  /** Файл в public/. */
  file: string;
  /** Сторона квадрата, px. */
  size: number;
}

/** Иконки сайта в public/ — по макету docs/design/og/ (рисует npm run icons). */
export const siteIcons: SiteIcon[] = [
  { rel: 'icon', file: 'favicon-16.png', size: 16 },
  { rel: 'icon', file: 'favicon-32.png', size: 32 },
  { rel: 'icon', file: 'favicon-48.png', size: 48 },
  { rel: 'apple-touch-icon', file: 'apple-touch-icon.png', size: 180 },
];

/**
 * favicon.ico в корне public/ — для программ, которые спрашивают /favicon.ico сами, не читая <head>.
 * Внутри — те же PNG 16, 32 и 48 (все иконки rel="icon"). В <head> не подключается: браузеру хватает PNG.
 */
export const faviconIco = 'favicon.ico';
