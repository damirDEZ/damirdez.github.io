// Внутренние ссылки с учётом подпапки сайта (base из astro.config.mjs).
// Сайт может жить в корне (<ник>.github.io) или в подпапке (<ник>.github.io/<репо>),
// поэтому ссылки вида "/..." или "#..." без этой функции не писать.

const base = import.meta.env.BASE_URL.replace(/\/+$/, '');

/**
 * withBase('/')      → "/" или "/repo/"
 * withBase('#work')  → "/#work" или "/repo/#work"
 * withBase('work/x') → "/work/x" или "/repo/work/x"
 */
export function withBase(path = '/'): string {
  return `${base}/${path.replace(/^\/+/, '')}`;
}
