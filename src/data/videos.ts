// Video (#video): сетка роликов. На главной — первые `maxOnHome`; кнопка «More videos» и плеер — T-005.
// Пусто — раздела и пункта меню нет.

import type { Chip, Media, PlaceholderMark, SectionHead } from './types';

export interface VideoItem extends PlaceholderMark {
  title: string;
  /** Длительность на кадре: "2:47". */
  duration?: string;
  /** Метки; ai: true — оранжевая метка ИИ. */
  chips: Chip[];
  /** Обложка ролика (image) или градиент-заглушка. */
  media: Media;
  /**
   * Ссылка на ролик (YouTube «по ссылке»). Есть — карточка открывает ролик в новой вкладке
   * (встроенный плеер — T-005). Нет — кнопка Play только для вида.
   */
  videoUrl?: string;
  /** Страница кейса ролика ("work/ai-short-film", src/data/cases.ts). Есть — карточка ведёт на кейс (а не на videoUrl). */
  caseUrl?: string;
}

export const videoSection: { head: SectionHead; maxOnHome: number; items: VideoItem[] } = {
  head: {
    label: 'Video',
    numbered: true,
    title: 'Editing & AI films',
    intro: 'Editing to your reference, AI-generated shots and short films, thumbnails that get the click.',
  },
  maxOnHome: 6,
  items: [
    {
      placeholder: true,
      title: 'AI short film',
      duration: '2:47',
      chips: [{ label: 'AI', ai: true }, { label: 'Story' }, { label: 'Edit' }],
      media: { gradient: 'g4', alt: 'AI short film — cover' },
      caseUrl: 'work/ai-short-film',
    },
    {
      placeholder: true,
      title: 'Brand promo edit',
      duration: '0:45',
      chips: [{ label: 'Edit' }, { label: 'Color' }, { label: 'Sound' }],
      media: { gradient: 'g2', alt: 'Brand promo edit — cover' },
    },
    {
      placeholder: true,
      title: 'Reels pack ×5',
      duration: '0:30',
      chips: [{ label: 'Vertical' }, { label: 'Edit' }],
      media: { gradient: 'g6', alt: 'Reels pack — cover' },
    },
    {
      placeholder: true,
      title: 'Music video edit',
      duration: '3:12',
      chips: [{ label: 'Edit' }, { label: 'AI shots', ai: true }],
      media: { gradient: 'g1', alt: 'Music video edit — cover' },
    },
    {
      placeholder: true,
      title: 'Edit to reference',
      duration: '1:05',
      chips: [{ label: 'Reference' }, { label: 'Edit' }],
      media: { gradient: 'g7', alt: 'Edit to reference — cover' },
    },
    {
      placeholder: true,
      title: 'AI concept trailer',
      duration: '1:58',
      chips: [{ label: 'Higgsfield', ai: true }, { label: 'Trailer' }],
      media: { gradient: 'g3', alt: 'AI concept trailer — cover' },
    },
  ],
};
