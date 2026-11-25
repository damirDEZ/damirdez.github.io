// How I work (#how): 3 пункта. Пусто — раздела нет. В меню шапки этого раздела нет.

import type { ConfirmMark, SectionHead } from './types';

export interface HowItem extends ConfirmMark {
  title: string;
  text: string;
}

export const howIWork: { head: SectionHead; items: HowItem[] } = {
  head: {
    label: 'How I work',
    title: 'Simple and fast',
  },
  items: [
    { title: 'Reference in — result out', text: 'Show me what you like. I’ll match the style and deliver on time.' },
    { title: 'I learn fast', text: 'New tool or new task — I pick it up quickly and get it done.' },
    {
      title: 'Freelance-ready',
      text: 'Clear deadlines, quick replies, revisions included.',
      needsConfirmation: '«revisions included» — обещание заказчику; Дамир подтверждает с материалами (T-009)',
    },
  ],
};
