// Кейсы (src/data/cases.ts): проверка данных, адрес страницы, порядок «как на главной» и следующий кейс для «Next work».
// Как устроено — docs/wiki/case.md.

import { cases, type CasePage } from '../data/cases';
import { selectedWork } from '../data/selected-work';
import { visibleSections, type HomeSectionId } from '../data/sections';
import { videoSection } from '../data/videos';
import { websites } from '../data/websites';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Ошибка в данных — сборка падает с понятным сообщением, а не выкладывает битую страницу.
const seen = new Set<string>();
for (const item of cases) {
  if (!slugPattern.test(item.slug)) {
    throw new Error(`src/data/cases.ts: slug «${item.slug}» — только строчные a–z, 0–9 и дефис (docs/wiki/case.md)`);
  }
  if (seen.has(item.slug)) throw new Error(`src/data/cases.ts: slug «${item.slug}» повторяется`);
  seen.add(item.slug);
}

/** "work/go-fashion" или "work/go-fashion/" → "go-fashion"; другой путь → undefined. */
export function caseSlugFromPath(path: string | undefined): string | undefined {
  return path?.trim().match(/^\/?work\/([^/?#]+)\/?$/)?.[1];
}

export function findCase(slug: string): CasePage | undefined {
  return cases.find((item) => item.slug === slug);
}

/** Путь страницы кейса для withBase(): "work/go-fashion/" (с косой чертой в конце — GitHub Pages не делает лишний переход). */
export function casePath(slug: string): string {
  return `work/${slug}/`;
}

/** Ссылки работ главной — по порядку видимых разделов (src/data/sections.ts) и карточек в них. */
function homeWorkLinks(): (string | undefined)[] {
  const bySection: Partial<Record<HomeSectionId, (string | undefined)[]>> = {
    work: selectedWork.items.map((item) => item.href),
    video: videoSection.items.slice(0, videoSection.maxOnHome).map((item) => item.caseUrl),
    web: websites.cases.map((item) => item.caseUrl),
  };
  return visibleSections.flatMap((section) => bySection[section.id] ?? []);
}

/**
 * Кейсы по порядку, как их видит посетитель главной сверху вниз (первое появление ссылки на кейс).
 * Кейсы, на которые главная не ссылается, — в конце, в порядке src/data/cases.ts.
 */
export const orderedCases: CasePage[] = (() => {
  const order: CasePage[] = [];
  for (const href of homeWorkLinks()) {
    const slug = caseSlugFromPath(href);
    const item = slug ? findCase(slug) : undefined;
    if (item && !order.includes(item)) order.push(item);
  }
  for (const item of cases) if (!order.includes(item)) order.push(item);
  return order;
})();

/** Следующий кейс для «Next work»: по порядку главной, у последнего — первый. Кейс один — нет. */
export function nextCase(slug: string): CasePage | undefined {
  if (orderedCases.length < 2) return undefined;
  const index = orderedCases.findIndex((item) => item.slug === slug);
  return orderedCases[(index + 1) % orderedCases.length];
}
