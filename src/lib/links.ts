// Ссылки и пути к картинкам из src/data/ → готовые адреса для href и src.

import { isSectionVisible } from '../data/sections';
import { caseSlugFromPath, casePath, findCase } from './cases';
import { withBase } from './paths';

const absolute = /^https?:\/\//i;

export interface ResolvedLink {
  href: string;
  /** Внешний адрес: открывать в новой вкладке (target="_blank" rel="noopener"). */
  external: boolean;
}

/** Любая другая схема (mailto:, tel:, tg:, //…) — ошибка в данных: withBase() сделал бы из неё битую ссылку. */
const otherScheme = /^([a-z][a-z0-9+.-]*:|\/\/)/i;

/**
 * - https://… — как есть, внешний;
 * - "#web" — раздел главной; раздел скрыт (нет работ) — ссылки нет (undefined);
 * - "work/go-fashion" — страница кейса (src/data/cases.ts) → "/work/go-fashion/"; такого кейса нет — сборка падает;
 * - другой путь сайта — через withBase();
 * - пусто — ссылки нет;
 * - другое (mailto:, tel:, //…) — сборка падает с понятной ошибкой.
 */
export function resolveLink(href: string | undefined): ResolvedLink | undefined {
  const value = href?.trim();
  if (!value) return undefined;
  if (absolute.test(value)) return { href: value, external: true };
  if (otherScheme.test(value)) {
    throw new Error(`src/data: ссылка «${value}» — поддерживаются только https://…, #раздел и путь сайта (docs/wiki/home.md)`);
  }
  if (value.startsWith('#')) {
    return isSectionVisible(value.slice(1)) ? { href: withBase(value), external: false } : undefined;
  }
  const slug = caseSlugFromPath(value);
  if (slug !== undefined) {
    if (!findCase(slug)) throw new Error(`src/data: ссылка «${value}» — кейса «${slug}» нет в src/data/cases.ts`);
    return { href: withBase(casePath(slug)), external: false };
  }
  return { href: withBase(value), external: false };
}

/** Путь к картинке: от папки public/ ("work/x.jpg") через withBase() или полный адрес https://… */
export function assetUrl(path: string): string {
  return absolute.test(path) ? path : withBase(path);
}
