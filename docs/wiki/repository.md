# Карта файлов

Сверено: 2026-11-25 (T-003: главная на заглушках; T-004: страница кейса; T-008: карточка ссылки и иконки).

```
AGENTS.md                         — правила проекта (главный файл)
CLAUDE.md                         — ссылка на AGENTS.md
.claude/skills/project-manager/   — скилл менеджера
package.json, package-lock.json   — зависимости и команды npm (dev, build, check, shots, og, icons)
astro.config.mjs                  — настройки Astro: site и base из SITE_URL / BASE_PATH
tsconfig.json                     — TypeScript strict
src/pages/                        — страницы сайта (index.astro — главная, work/[slug].astro — кейс /work/<slug>/)
src/layouts/Base.astro            — каркас страницы: head (в том числе карточка ссылки, иконки), шапка, подвал
src/components/layout/            — шапка (Header.astro) и подвал (Footer.astro)
src/components/home/              — блоки главной и общие части (кадр, окно браузера, карточка контакта, карточка работы, метки)
src/components/case/              — блоки страницы кейса
src/data/                         — тексты, работы, ссылки и контакты главной; кейсы (cases.ts); порядок разделов и меню (sections.ts);
                                    тексты карточки ссылки (link-card.ts)
src/styles/tokens.css             — дизайн-токены, единственный источник
src/styles/base.css               — базовые стили, кнопки, подпись .eyebrow, отступ под шапку при переходе по якорю
src/lib/paths.ts                  — withBase(): ссылки с учётом подпапки сайта
src/lib/links.ts                  — ссылки и пути к картинкам из src/data/ → готовые адреса
src/lib/cases.ts                  — кейсы: адрес страницы, порядок «как на главной», следующий для «Next work»
src/lib/og.ts                     — карточка ссылки (размер, путь у страницы) и список иконок
public/og/                        — карточки ссылки 1200×630: home.png и <slug>.png кейсов (рисует npm run og)
public/favicon-16/32/48.png, public/apple-touch-icon.png, public/favicon.ico — иконки сайта (рисует npm run icons)
scripts/site-env.mjs              — чтение SITE_URL и BASE_PATH
scripts/shots.mjs                 — снимки главной 390/1280/1920 + меню и кейсов; автопроверки (прокрутка, меню, якоря, ссылки, доступность, «Next work», meta-теги и иконки)
scripts/og.mjs                    — рисует и проверяет карточки ссылки (npm run og)
scripts/icons.mjs                 — рисует и проверяет иконки (npm run icons)
scripts/images.mjs                — общее для og/icons/shots: чтение .ts из Node, токены, шрифты, PNG, ICO, Chrome
.github/workflows/deploy.yml      — выкладка на GitHub Pages при пуше в main
docs/roadmap/roadmap.toml         — роадмап, единственный источник задач
docs/roadmap/handoff.md           — состояние менеджера для передачи дел
docs/roadmap/briefs/              — готовые первые сообщения исполнителям (T-NNN.md)
docs/wiki/                        — техническая документация
docs/adr/                         — записи решений
docs/design/system.md             — дизайн-система: правила
docs/design/system.html           — витрина компонентов (+ system-1280.png); токены берёт из src/styles/tokens.css
docs/design/home/                 — одобренный макет главной: html, снимки, описание
docs/design/case/                 — одобренный макет страницы кейса (Go Fashion): html, снимки, описание
docs/design/og/                   — одобренный макет иконки и карточки ссылки: html, снимок, описание
docs/design/tools/shoot.py        — снимки макетов headless Chrome (390/1280/1920)
docs/known-issues.md              — известные проблемы
.gitattributes                    — переводы строк LF для всех файлов
.gitignore                        — сборка, зависимости, снимки, секреты
```

Не в git: `node_modules/`, `dist/` (сборка), `.astro/` (служебное Astro), `shots/` (снимки).

## Где находится …

- Цвета, шрифты, отступы — `src/styles/tokens.css`, описание — `docs/design/system.md`.
- Шапка и меню, подвал — `src/components/layout/`; как устроены — `docs/wiki/site.md`.
- Тексты и работы главной, контакты — `src/data/`; как заменить заглушки — `docs/wiki/home.md`.
- Блоки главной — `src/components/home/`; как устроены — `docs/wiki/home.md`.
- Страница кейса: шаблон — `src/pages/work/[slug].astro`, блоки — `src/components/case/`, данные — `src/data/cases.ts`; как устроена и как добавить кейс — `docs/wiki/case.md`.
- Как собрать, снять снимки, как работает выкладка — `docs/wiki/site.md`.
- Карточка ссылки, иконки, meta-теги, как их перерисовать — `docs/wiki/seo.md`.
- Как должна выглядеть главная — `docs/design/home/home.html` и `home.md`; кейс — `docs/design/case/case.html` и `case.md`.
