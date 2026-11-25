// Страницы кейсов /work/<slug>/ (T-004) — один шаблон для сайта, ролика и игры.
// Макет: docs/design/case/case.html (Дамир 25.11). Как устроено и как добавить кейс — docs/wiki/case.md.
//
// Порядок кейсов для «Next work» — как на главной (src/lib/cases.ts), а не порядок в этом файле.
// Пустые поля не ломают страницу: нет ссылки — нет кнопки, нет значения в мета — нет ячейки,
// нет шагов — нет списка, нет `ai` — нет выноски, нет `gallery` (или кадров) — нет галереи.

import type { Chip, ConfirmMark, Media, PlaceholderMark } from './types';

/** Тип работы: от него зависят подписи (заголовок блока контакта). */
export type CaseKind = 'website' | 'video' | 'game';

/** Ячейка мета-строки: «My role — Development with Claude Code». */
export interface CaseMeta extends ConfirmMark {
  label: string;
  /** Нет значения — нет ячейки (сетка подстраивается). */
  value?: string;
}

/** Глава: слева номер и подпись («01 — Task», номер ставится сам), справа H2 и текст. */
export interface CaseChapter {
  /** "Task", "What we did", "Result". */
  label: string;
  title: string;
  /** Абзацы текста. */
  text: string[];
  /** Нумерованные шаги под текстом. Нет — нет списка. */
  steps?: string[];
}

/**
 * Обложка под шапкой кейса:
 * - browser — окно браузера со снимком сайта (`browserLabel` — текст в строке адреса);
 * - video — кадр с кнопкой Play и длительностью (Play пока только вид, плеер — T-005).
 */
export type CaseCover =
  | { type: 'browser'; media: Media; browserLabel?: string }
  | { type: 'video'; media: Media; duration?: string };

/** Выноска «How AI helped»: текст и метки инструментов (ai: true — оранжевая). */
export interface CaseAiNote extends ConfirmMark {
  text: string;
  chips: Chip[];
}

/**
 * Кадр галереи:
 * - desktop — окно браузера (2 колонки из 3);
 * - phone — кадр телефона 9:19 (1 колонка из 3);
 * - still — простой кадр 16:9, например кадр из ролика (как окно — широкий).
 */
export type CaseShot =
  | { device: 'desktop'; media: Media; browserLabel?: string; caption?: string }
  | { device: 'phone'; media: Media; caption?: string }
  | { device: 'still'; media: Media; caption?: string };

export interface CaseGallery {
  /** H2 галереи: "Screens". */
  title: string;
  /** Строка справа от заголовка. */
  intro?: string;
  /** Порядок внутри окон и внутри телефонов сохраняется; ряды «окно + телефон» собираются сами. Больше `caseLimits.gallery` — лишние не показываются. */
  shots: CaseShot[];
}

export interface CasePage extends PlaceholderMark {
  /** Адрес страницы: /work/<slug>/. Только a–z, 0–9 и дефис. */
  slug: string;
  kind: CaseKind;
  /** Подпись над названием: "Case study · Website · Team project". */
  eyebrow: string;
  /** H1 и заголовок вкладки («<title> — Case study · Damir»). */
  title: string;
  /** Строка под H1; она же description страницы. */
  lead: string;
  /** Строка в карточке «Next work» на соседнем кейсе. Нет — берётся `lead`. */
  summary?: string;
  /** Метки в карточке «Next work» на соседнем кейсе. */
  chips: Chip[];
  /** Живой сайт (https://…). Есть — кнопка «Visit live site ↗» в новой вкладке. */
  liveUrl?: string;
  /** Ролик (YouTube «по ссылке»). Есть — кнопка «Watch ↗» в новой вкладке (плеер — T-005). */
  videoUrl?: string;
  /** До `caseLimits.meta` ячеек; пустые значения пропускаются. */
  meta: CaseMeta[];
  cover: CaseCover;
  /** Главы Task / What we did / Result — хотя бы одна. */
  chapters: [CaseChapter, ...CaseChapter[]];
  ai?: CaseAiNote;
  gallery?: CaseGallery;
}

/** Сколько показываем: ячеек мета-строки (одна строка в 4 колонки) и кадров галереи. */
export const caseLimits = { meta: 4, gallery: 8 };

/** Подписи страницы кейса — общие для всех кейсов. */
export const caseLabels: {
  back: string;
  /** Хвост заголовка вкладки: "Go Fashion — Case study · Damir". */
  titleSuffix: string;
  liveSite: string;
  watch: string;
  aiTitle: string;
  /** Текст в иконке выноски. */
  aiIcon: string;
  next: string;
  viewCase: string;
  /** Заголовок и строка блока контакта — под тип работы. Подпись, кнопки и адрес почты — из contact.ts. */
  contact: Record<CaseKind, { title: string; text: string } & ConfirmMark>;
} = {
  back: '← All work',
  titleSuffix: ' — Case study · Damir',
  liveSite: 'Visit live site ↗',
  watch: 'Watch ↗',
  aiTitle: 'How AI helped',
  aiIcon: 'AI',
  next: 'Next work',
  viewCase: 'View case →',
  contact: {
    website: {
      title: 'Want a site like this?',
      text: 'Tell me about your idea — I’ll tell you how fast we can launch it.',
    },
    video: {
      title: 'Want a video like this?',
      text: 'Send me a reference or an idea — I’ll show you how it can look.',
      needsConfirmation: '«I’ll show you how it can look» — строка придумана в T-004 (в макете её нет); Дамир подтверждает или правит',
    },
    game: {
      title: 'Want to work together?',
      text: 'Tell me about your project — let’s see what we can build.',
      needsConfirmation: 'строка придумана в T-004 (в макете её нет); Дамир подтверждает или правит',
    },
  },
};

/** Подсказка для needsConfirmation: цифры и факты кейса выдуманы в макете. */
const invented = (what: string) => `«${what}» — выдумано в макете; Дамир называет настоящее с материалами (T-009)`;

export const cases: CasePage[] = [
  {
    // Тексты, цифры и картинки — из макета docs/design/case/case.html; настоящие — с материалами Дамира (T-009).
    placeholder: true,
    slug: 'go-fashion',
    kind: 'website',
    eyebrow: 'Case study · Website · Team project',
    title: 'Go Fashion',
    lead: 'A complete fashion website we built from scratch as a team — from the first idea to launch.',
    chips: [{ label: 'Web' }, { label: 'Claude Code', ai: true }, { label: 'Team' }],
    // liveUrl: 'https://…' — ссылки на живой сайт пока нет (T-009); нет ссылки — нет кнопки.
    meta: [
      { label: 'My role', value: 'Development with Claude Code', needsConfirmation: invented('Development with Claude Code') },
      { label: 'Team', value: '3 people', needsConfirmation: invented('3 people') },
      { label: 'Timeline', value: '6 weeks', needsConfirmation: invented('6 weeks') },
      { label: 'Year', value: '2026', needsConfirmation: invented('2026') },
    ],
    cover: {
      type: 'browser',
      browserLabel: 'gofashion — home page',
      media: {
        gradient: 'g3',
        alt: 'Go Fashion website — home page',
        placeholderLabel: 'Go Fashion — home page screenshot',
      },
    },
    chapters: [
      {
        label: 'Task',
        title: 'A brand with no website',
        text: [
          'A fashion brand needed its own website — a place to show collections and bring in customers. We started with nothing: no design, no code, no template.',
        ],
      },
      {
        label: 'What we did',
        title: 'From idea to working site',
        text: [
          'We planned the pages together, then designed and built the whole site as a team. I handled development with Claude Code: quick prototypes first, then clean, working pages.',
        ],
        steps: ['Page structure and design', 'Development with Claude Code', 'Testing on phone and desktop', 'Launch'],
      },
      {
        label: 'Result',
        title: 'Live and ready for customers',
        text: ['A finished, working website, built from zero by a small team in a short time.'],
      },
    ],
    ai: {
      text: 'Claude Code wrote the first version of every page; I reviewed, tested and refined it. That’s how a small team shipped a full site fast.',
      chips: [{ label: 'Claude Code', ai: true }, { label: 'ChatGPT', ai: true }, { label: 'Web design' }, { label: 'Team' }],
    },
    gallery: {
      title: 'Screens',
      intro: 'Desktop and phone — every page works on both.',
      shots: [
        {
          device: 'desktop',
          browserLabel: 'gofashion — catalog',
          caption: 'Catalog',
          media: { gradient: 'g3b', alt: 'Go Fashion — catalog page on desktop', placeholderLabel: 'Catalog page' },
        },
        {
          device: 'phone',
          caption: 'Home — phone',
          media: { gradient: 'g3c', alt: 'Go Fashion — home page on a phone', placeholderLabel: 'Home on phone' },
        },
        {
          device: 'phone',
          caption: 'Product — phone',
          media: { gradient: 'g3b', alt: 'Go Fashion — product page on a phone', placeholderLabel: 'Product on phone' },
        },
        {
          device: 'desktop',
          browserLabel: 'gofashion — product',
          caption: 'Product page',
          media: { gradient: 'g3c', alt: 'Go Fashion — product page on desktop', placeholderLabel: 'Product page' },
        },
      ],
    },
  },
  {
    // Заглушка целиком: тексты придуманы в тоне docs/design/system.md; настоящий ролик и слова — от Дамира (T-009).
    placeholder: true,
    slug: 'ai-short-film',
    kind: 'video',
    eyebrow: 'Case study · AI short film',
    title: 'Mini film, made with AI',
    lead: 'An AI short film — generated, edited and scored end-to-end.',
    chips: [{ label: 'Higgsfield', ai: true }, { label: 'ChatGPT', ai: true }, { label: 'Edit' }],
    // videoUrl: 'https://youtu.be/…' — ролика пока нет (T-009); нет ссылки — нет кнопки «Watch ↗».
    meta: [
      { label: 'My role', value: 'Script, AI shots, edit', needsConfirmation: invented('Script, AI shots, edit') },
      { label: 'Length', value: '2:47', needsConfirmation: invented('2:47') },
      // Срок — спросить у Дамира (T-009). Пока значения нет — ячейки нет.
      { label: 'Timeline' },
      { label: 'Year', value: '2026', needsConfirmation: invented('2026') },
    ],
    cover: {
      type: 'video',
      duration: '2:47',
      media: { gradient: 'g4', alt: 'Still from the AI short film' },
    },
    chapters: [
      {
        label: 'Task',
        title: 'A film made only with AI',
        text: ['Make a short film where every shot is generated — and it still feels like cinema, not a tech demo.'],
      },
      {
        label: 'What I did',
        title: 'Script, shots, edit',
        text: [
          'I wrote the script and shot list, generated every shot in Higgsfield, then cut it together with music and sound — like any film edit.',
        ],
      },
      {
        label: 'Result',
        title: 'One story, one look',
        text: ['A finished short film with a consistent look from the first frame to the last.'],
      },
    ],
    ai: {
      text: 'Higgsfield generated every shot from my prompts; ChatGPT helped with the script and the shot list. I picked the best takes and edited them into one story.',
      chips: [{ label: 'Higgsfield', ai: true }, { label: 'ChatGPT', ai: true }, { label: 'Edit' }],
    },
    gallery: {
      title: 'Stills',
      intro: 'A few frames from the film.',
      shots: [
        { device: 'still', media: { gradient: 'g1', alt: 'Still from the AI short film — opening shot', placeholderLabel: 'Film still' } },
        { device: 'still', media: { gradient: 'g7', alt: 'Still from the AI short film — final scene', placeholderLabel: 'Film still' } },
      ],
    },
  },
];
