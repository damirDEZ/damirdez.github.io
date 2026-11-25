// @ts-check
// Адрес сайта и подпапка из переменных окружения.
// Общий источник для astro.config.mjs и scripts/shots.mjs — см. docs/wiki/site.md.
//
// SITE_URL  — адрес без подпапки, например https://<ник>.github.io (по умолчанию не задан).
// BASE_PATH — подпапка: "/" для <ник>.github.io, "/<репо>" для <ник>.github.io/<репо> (по умолчанию "/").

/**
 * Приводит подпапку к виду "/" или "/имя" (без завершающего слэша).
 * @param {string | undefined} value
 * @returns {string}
 */
export function normalizeBase(value) {
  const trimmed = String(value ?? '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}` : '/';
}

/**
 * @param {Record<string, string | undefined>} [env]
 * @returns {{ site: string | undefined, base: string }}
 */
export function getSiteEnv(env = process.env) {
  const site = env.SITE_URL?.trim() || undefined;
  return { site, base: normalizeBase(env.BASE_PATH) };
}
