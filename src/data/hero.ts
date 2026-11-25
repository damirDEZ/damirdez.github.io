// Первый экран главной: кто Дамир, одна фраза, кнопки Telegram и почты, инструменты, шоурил.
// Тексты — из одобренного макета (docs/design/home/home.html).

import type { Media, PlaceholderMark } from './types';

export interface Showreel extends PlaceholderMark {
  media: Media;
  /** Длительность на кадре: "1:30". */
  duration?: string;
  /** Подпись под кадром. */
  caption: string;
  /** Ссылка на ролик (YouTube «по ссылке»). Есть — под кадром ссылка `watchLabel`, в новой вкладке. Встроенный плеер — T-005. */
  videoUrl?: string;
  watchLabel: string;
}

export interface Hero {
  eyebrow: string;
  /** H1: начало, акцентная (оранжевая) часть, конец. */
  title: { start: string; accent: string; end: string };
  lead: string;
  /** Подписи кнопок; адреса — из contacts.ts. */
  telegramLabel: string;
  emailLabel: string;
  toolsLabel: string;
  tools: string[];
  /** Нет шоурила — текст первого экрана на всю ширину. */
  showreel?: Showreel;
}

export const hero: Hero = {
  eyebrow: 'Video editor · AI developer · Game dev',
  title: {
    start: 'I turn ideas into ',
    accent: 'videos, websites and games',
    end: ' — fast, with AI.',
  },
  lead: 'Freelance video editor who makes AI short films, designs thumbnails and builds web apps with Claude Code. Send me a reference — I’ll match it.',
  telegramLabel: 'Message on Telegram',
  emailLabel: 'Email me',
  toolsLabel: 'Daily tools:',
  tools: ['Claude Code', 'ChatGPT', 'Higgsfield'],
  showreel: {
    placeholder: true,
    media: {
      gradient: 'g1',
      alt: 'Showreel 2026 — editing and AI video',
      placeholderLabel: 'Showreel',
    },
    duration: '1:30',
    caption: 'Showreel 2026 — editing & AI video',
    watchLabel: 'Watch ↗',
  },
};
