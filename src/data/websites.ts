// Websites (#web): кейсы в рамке браузера + полоса «новый проект в работе».
// Нет кейсов — раздела и пункта меню нет (одной полосы мало: это не работа).

import type { Chip, Media, PlaceholderMark, SectionHead } from './types';

export interface CaseStudy extends PlaceholderMark {
  /** Подпись над названием: "Case study · Team project". */
  eyebrow: string;
  title: string;
  /** Текст в строке адреса окна браузера. */
  browserLabel: string;
  /** Снимок сайта (image) или градиент-заглушка. */
  media: Media;
  /** Строки Task / What we did / Result. */
  rows: { label: string; text: string }[];
  chips: Chip[];
  /** Страница кейса ("work/go-fashion", src/data/cases.ts; такого кейса нет — сборка падает). Есть — кнопка «View case». */
  caseUrl?: string;
  /** Живой сайт (https://…). Есть — кнопка «Live site ↗», в новой вкладке. */
  liveUrl?: string;
}

export interface UpcomingProject {
  /** Жирная часть: "New project in progress." */
  title: string;
  text: string;
  /** Справа: "2026". */
  note?: string;
}

export const websites: {
  head: SectionHead;
  labels: { viewCase: string; liveSite: string };
  cases: CaseStudy[];
  upcoming?: UpcomingProject;
} = {
  head: {
    label: 'Websites',
    numbered: true,
    title: 'Sites & apps, built with AI',
    intro: 'I vibe-code with Claude Code: from an empty folder to a working site — quickly and properly.',
  },
  labels: { viewCase: 'View case', liveSite: 'Live site ↗' },
  cases: [
    {
      placeholder: true,
      eyebrow: 'Case study · Team project',
      title: 'Go Fashion',
      browserLabel: 'gofashion — live site',
      media: {
        gradient: 'g3',
        alt: 'Go Fashion website — home page',
        placeholderLabel: 'Go Fashion — home page screenshot',
      },
      rows: [
        { label: 'Task', text: 'Launch a fashion brand website — starting from zero.' },
        { label: 'What we did', text: 'Designed and built the full site as a team; I worked on it with Claude Code.' },
        { label: 'Result', text: 'A finished, working website — live and ready for customers.' },
      ],
      chips: [{ label: 'Claude Code', ai: true }, { label: 'Web design' }, { label: 'Team' }],
      caseUrl: 'work/go-fashion',
    },
  ],
  upcoming: {
    title: 'New project in progress.',
    text: 'Case study coming soon.',
    note: '2026',
  },
};
