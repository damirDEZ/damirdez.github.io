// Карточка ссылки — картинка 1200×630, которую Telegram и мессенджеры показывают под ссылкой на сайт.
// Макет: docs/design/og/og.html (Дамир 25.11). Как устроено — docs/wiki/seo.md.
//
// Картинки рисует `npm run og` (scripts/og.mjs) в public/og/ из данных:
// - главная (og/home.png): фраза — здесь; роли — hero.ts (eyebrow); ник — contacts.ts;
//   кадры — первые три работы Selected work (selected-work.ts): их картинки (или градиенты) и подписи `cardLabel`;
// - кейс (og/<slug>.png): название, подпись и обложка — cases.ts.
// Поменял что-то из этого — запусти `npm run og`, иначе `npm run check` упадёт («карточка устарела»).

export interface LinkCard {
  /** Имя сайта в превью (og:site_name). */
  siteName: string;
  /** Фраза карточки главной: начало и акцентная (оранжевая) часть. Не длиннее двух строк. */
  title: { start: string; accent: string };
  /** Подпись перед ником Telegram в правом верхнем углу. Ника нет (contacts.ts) — угол пустой. */
  telegramLabel: string;
}

export const linkCard: LinkCard = {
  siteName: 'Damir',
  title: { start: 'Videos, websites and games — ', accent: 'made fast, with AI.' },
  telegramLabel: 'Telegram',
};
