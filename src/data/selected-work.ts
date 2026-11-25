// Selected work (#work): 3 лучшие работы, первая — крупно. Пусто — раздела и пункта меню нет.

import type { Badge, Chip, Media, PlaceholderMark, SectionHead } from './types';

export interface WorkItem extends PlaceholderMark {
  /** Тип работы над заголовком: "Website · Team project". */
  kind?: string;
  /**
   * Подпись на кадре этой работы в карточке ссылки главной (public/og/home.png, src/data/link-card.ts): "Website".
   * Нет — первая часть `kind` (до « · »). Поменял — `npm run og`.
   */
  cardLabel?: string;
  title: string;
  /** Одна строка описания. */
  description?: string;
  chips: Chip[];
  media: Media;
  badge?: Badge;
  /** Это ролик: на кадре кнопка Play (только вид) и длительность. */
  video?: { duration?: string };
  /**
   * Куда ведёт карточка. "work/go-fashion" — страница кейса (src/data/cases.ts; такого кейса нет — сборка падает);
   * "#web" — раздел главной (скрыт раздел — ссылки нет); https://… — внешний адрес, в новой вкладке. Нет — карточка не ссылка.
   */
  href?: string;
}

export const selectedWork: { head: SectionHead; items: WorkItem[] } = {
  head: {
    label: 'Selected work',
    title: 'Best of what I do',
    intro: 'Three projects that show the range: a full website built with a team, an AI short film, and my own game.',
  },
  items: [
    {
      placeholder: true,
      kind: 'Website · Team project',
      cardLabel: 'Website',
      title: 'Go Fashion',
      description: 'A complete fashion website we built from scratch as a team — from first idea to launch.',
      chips: [{ label: 'Web' }, { label: 'Claude Code', ai: true }, { label: 'Team' }],
      media: { gradient: 'g3', alt: 'Go Fashion website — home page', placeholderLabel: 'Go Fashion — screenshot' },
      badge: { text: 'Live', live: true },
      href: 'work/go-fashion',
    },
    {
      placeholder: true,
      kind: 'AI short film',
      cardLabel: 'AI film',
      title: 'Mini film, made with AI',
      chips: [{ label: 'Higgsfield', ai: true }, { label: 'ChatGPT', ai: true }, { label: 'Edit' }],
      media: { gradient: 'g4', alt: 'Still from an AI short film' },
      video: { duration: '2:47' },
      href: 'work/ai-short-film',
    },
    {
      placeholder: true,
      kind: 'Game dev',
      cardLabel: 'Game',
      title: 'My game — early build',
      chips: [{ label: 'Game design' }, { label: 'AI-assisted', ai: true }],
      media: { gradient: 'g5', alt: 'Screenshot from my game in development', placeholderLabel: 'Game — screenshot' },
      badge: { text: 'In development' },
      href: '#game',
    },
  ],
};
