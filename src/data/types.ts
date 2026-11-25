// Общие типы данных сайта. Все тексты, работы, ссылки и контакты лежат в src/data/,
// компоненты src/components/home/ и src/components/case/ только рисуют их.
// Как заменить заглушки реальными работами — docs/wiki/home.md и docs/wiki/case.md.

/**
 * Градиенты-заглушки из одобренных макетов: g1…g7 — docs/design/home/home.html,
 * g3b и g3c (оттенки g3 для экранов галереи) — docs/design/case/case.html.
 */
export type Gradient = 'g1' | 'g2' | 'g3' | 'g3b' | 'g3c' | 'g4' | 'g5' | 'g6' | 'g7';

/** Кадр: картинка или, пока её нет, градиент-заглушка. */
export interface Media {
  /**
   * Картинка. Путь от папки public/ без начальной косой черты
   * ("work/go-fashion.jpg" → файл public/work/go-fashion.jpg) или полный адрес https://…
   * Нет — показывается градиент `gradient`.
   */
  image?: string;
  /** Градиент-заглушка, пока картинки нет. */
  gradient: Gradient;
  /** Что на кадре — для экранного диктора (alt). Обязательно, по-английски. */
  alt: string;
  /** Подпись поверх заглушки ("Go Fashion — screenshot"). Видна только без картинки. */
  placeholderLabel?: string;
}

/** Метка под работой. ai: true — оранжевая метка ИИ. */
export interface Chip {
  label: string;
  ai?: boolean;
}

/** Бейдж слева сверху на кадре. live: true — с зелёной точкой («Live»). */
export interface Badge {
  text: string;
  live?: boolean;
}

/** true — работа, текст или картинка временные (черновик макета); заменить реальными (T-009). */
export interface PlaceholderMark {
  placeholder?: boolean;
}

/** Текст-обещание, который Дамир ещё не подтвердил: что именно подтвердить. На сайте выводится как обычно. */
export interface ConfirmMark {
  needsConfirmation?: string;
}

/** Заголовок раздела: подпись (eyebrow), H2 и строка пояснения справа. */
export interface SectionHead {
  /** Подпись над заголовком: "Video". */
  label: string;
  /** true — перед подписью номер раздела ("01 — Video"). Номер ставится сам, по порядку видимых нумерованных разделов. */
  numbered?: boolean;
  /** Заголовок H2. */
  title: string;
  /** Пояснение справа от заголовка (на телефоне — под ним). */
  intro?: string;
}
