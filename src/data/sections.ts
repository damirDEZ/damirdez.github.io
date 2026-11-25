// Разделы главной по порядку — единственный источник порядка, видимости, номеров и меню шапки.
// Раздел без работ не показывается, и его пункта нет в меню (docs/design/system.md → «Пустое состояние»).

import { aiSection } from './ai';
import { gameSection } from './game';
import { howIWork } from './how-i-work';
import { selectedWork } from './selected-work';
import type { SectionHead } from './types';
import { videoSection } from './videos';
import { websites } from './websites';

export type HomeSectionId = 'work' | 'video' | 'web' | 'game' | 'ai' | 'how' | 'contact';

export interface HomeSection {
  /** id блока на странице — якорь "#work". */
  id: HomeSectionId;
  /** Подпись в меню шапки. Нет — раздела в меню нет. */
  nav?: string;
  head?: SectionHead;
  /** Есть что показать. */
  visible: boolean;
}

export const homeSections: HomeSection[] = [
  { id: 'work', nav: 'Work', head: selectedWork.head, visible: selectedWork.items.length > 0 },
  { id: 'video', nav: 'Video', head: videoSection.head, visible: videoSection.items.length > 0 },
  // Полоса «New project in progress» — не работа: без кейсов раздела нет.
  { id: 'web', nav: 'Websites', head: websites.head, visible: websites.cases.length > 0 },
  { id: 'game', nav: 'Game dev', head: gameSection.head, visible: gameSection.project !== null },
  {
    id: 'ai',
    nav: 'AI',
    head: aiSection.head,
    visible: aiSection.tools.length > 0 || aiSection.covers.items.length > 0,
  },
  { id: 'how', head: howIWork.head, visible: howIWork.items.length > 0 },
  // Контакт — не раздел с работами: виден всегда (на него ведёт «Hire me» в шапке).
  { id: 'contact', nav: 'Contact', visible: true },
];

export const visibleSections = homeSections.filter((s) => s.visible);

/** Пункты меню шапки: только видимые разделы с подписью. */
export const navSections = visibleSections.flatMap((s) => (s.nav ? [{ id: s.id, label: s.nav }] : []));

export function isSectionVisible(id: string): boolean {
  return visibleSections.some((s) => s.id === id);
}

/** Подпись над заголовком раздела: "Selected work" или с номером — "01 — Video" (номер по видимым нумерованным разделам). */
export function sectionEyebrow(id: HomeSectionId): string {
  const section = homeSections.find((s) => s.id === id);
  const head = section?.head;
  if (!head) return '';
  if (!head.numbered) return head.label;
  const numbered = visibleSections.filter((s) => s.head?.numbered);
  const index = numbered.findIndex((s) => s.id === id);
  return `${String(index + 1).padStart(2, '0')} — ${head.label}`;
}
