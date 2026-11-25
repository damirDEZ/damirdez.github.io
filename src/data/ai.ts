// AI (#ai): карточки инструментов + обложки-превью.
// Нет ни инструментов, ни обложек — раздела и пункта меню нет; нет обложек — нет подраздела «Thumbnails & covers».

import type { Media, PlaceholderMark, SectionHead } from './types';

export interface AiTool {
  /** Монограмма в иконке: "CC". */
  monogram: string;
  name: string;
  /** Для чего — одна-две строки. */
  text: string;
}

export interface Cover extends PlaceholderMark {
  /** Заголовок обложки. На заглушке написан крупно поверх градиента; с картинкой — только alt (текст уже на картинке). */
  title: string;
  media: Media;
}

export const aiSection: {
  head: SectionHead;
  tools: AiTool[];
  covers: { title: string; intro?: string; items: Cover[] };
} = {
  head: {
    label: 'AI',
    numbered: true,
    title: 'AI is in every project',
    intro: 'Not a buzzword — my everyday toolkit. Look for the orange tags on each work.',
  },
  tools: [
    { monogram: 'CC', name: 'Claude Code', text: 'Vibe-coding websites, apps and game logic. Fast prototypes, clean results.' },
    { monogram: 'GPT', name: 'ChatGPT', text: 'Scripts, ideas, prompts and copy — the thinking part of every project.' },
    { monogram: 'HF', name: 'Higgsfield', text: 'AI video and image generation for short films, shots and visuals.' },
  ],
  covers: {
    title: 'Thumbnails & covers',
    intro: 'Designed to get the click.',
    items: [
      { placeholder: true, title: 'I made a film with AI', media: { gradient: 'g4', alt: 'Cover: I made a film with AI' } },
      { placeholder: true, title: '24 hours to build a site', media: { gradient: 'g2', alt: 'Cover: 24 hours to build a site' } },
      { placeholder: true, title: 'Devlog #1', media: { gradient: 'g1', alt: 'Cover: Devlog #1' } },
      { placeholder: true, title: 'Edit like the reference', media: { gradient: 'g6', alt: 'Cover: Edit like the reference' } },
    ],
  },
};
