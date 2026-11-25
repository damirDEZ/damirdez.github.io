// Game dev (#game): большой кадр + маленькие, название, что сделано / что дальше.
// project: null — раздела и пункта меню нет.

import type { Badge, Media, PlaceholderMark, SectionHead } from './types';

export interface DevlogEntry {
  /** "Next" выделяется акцентом. */
  status: 'Done' | 'In progress' | 'Next';
  text: string;
}

export interface GameProject extends PlaceholderMark {
  /** Большой кадр (скриншот игры) и бейдж на нём. */
  media: Media;
  badge?: Badge;
  /** Маленькие кадры под большим (в макете — 3). */
  shots: Media[];
  title: string;
  text: string;
  devlog: DevlogEntry[];
}

export const gameSection: { head: SectionHead; project: GameProject | null } = {
  head: {
    label: 'Game dev',
    numbered: true,
    title: 'My own game',
    intro: 'Early development — but the world is taking shape. Follow the progress.',
  },
  project: {
    placeholder: true,
    media: { gradient: 'g5', alt: 'Gameplay screenshot', placeholderLabel: 'Gameplay screenshot' },
    badge: { text: 'Early development' },
    shots: [
      { gradient: 'g2', alt: 'Game screenshot 1' },
      { gradient: 'g7', alt: 'Game screenshot 2' },
      { gradient: 'g6', alt: 'Game screenshot 3' },
    ],
    title: 'Working title',
    text: 'Design, code and visuals — with AI as my co-pilot.',
    devlog: [
      { status: 'Done', text: 'Core gameplay prototype' },
      { status: 'Done', text: 'First playable level' },
      { status: 'In progress', text: 'Characters and art style' },
      { status: 'Next', text: 'Trailer and demo build' },
    ],
  },
};
