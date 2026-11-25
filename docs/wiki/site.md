<!-- wiki:code src/ astro.config.mjs scripts/ .github/workflows/ -->
# Сайт: каркас, сборка, снимки, выкладка

Сверено с кодом: 2026-11-25 (T-002, T-003, T-004, T-008; коммита ещё нет).

Статический сайт на Astro 7 (TypeScript strict, без UI-фреймворков). Почему Astro и GitHub Pages — `docs/adr/0001-portfolio-basics.md`. Как должно выглядеть — `docs/design/system.md` и макеты `docs/design/home/`, `docs/design/case/`. Главная страница и её данные — `docs/wiki/home.md`, страницы кейсов — `docs/wiki/case.md`, карточка ссылки, иконки и meta-теги — `docs/wiki/seo.md`.

## Как устроено

1. Каждая страница в `src/pages/` строится на общем каркасе `src/layouts/Base.astro`.
2. `Base.astro` подключает шрифты, токены и базовые стили, пишет `<head>` (title, description, `lang="en"`, карточка ссылки `og:*` / `twitter:card`, канонический адрес, иконки, `theme-color` — `docs/wiki/seo.md`) и ставит шапку и подвал вокруг содержимого страницы (`<main id="main">`).
3. Шапка (`Header.astro`) — липкая, полупрозрачная с размытием: логотип «DAMIR.», разделы Work · Video · Websites · Game dev · AI · Contact (якоря `#work`, `#video`, `#web`, `#game`, `#ai`, `#contact` на главной), кнопка «Hire me» → `#contact`.
   - Пункты меню берутся из `src/data/sections.ts` (`navSections`): раздел главной без работ не показывается ни на странице, ни в меню (T-003).
   - При переходе по якорю раздел не уходит под липкую шапку: `scroll-padding-top` в `base.css` = высота шапки (72px, ≤640px — 64px).
   - ≤1020px разделы прячутся, видна кнопка меню. Она открывает список разделов под шапкой (`aria-expanded`, `aria-controls="site-menu"`, атрибут `hidden` у списка).
   - Закрывается: повторным нажатием, кликом по пункту, кликом мимо меню, по Escape (фокус возвращается на кнопку), когда фокус клавиатуры уходит из меню, и при расширении окна больше 1020px.
   - Вид открытого меню (крупные пункты Space Grotesk с линиями, сплошной фон, крестик на кнопке) в макете не нарисован — предложение T-002, снимок `shots/home-390-menu.png`.
   - Скрипт — несколько строк в самом `Header.astro`, без библиотек. Без JS меню на телефоне не откроется, «Hire me» и логотип работают.
4. Подвал (`Footer.astro`) — «© 2026 Damir» и «This site is built by me — with Claude Code.».
5. `astro build` складывает готовый сайт в `dist/`; GitHub Actions выкладывает его на GitHub Pages.

## Где лежит

```
astro.config.mjs                  — настройки Astro: site и base из окружения, цель сборки CSS
tsconfig.json                     — TypeScript strict (astro/tsconfigs/strict)
package.json, package-lock.json   — зависимости и команды npm
src/pages/index.astro             — главная: первый экран и разделы по src/data/sections.ts (docs/wiki/home.md)
src/pages/work/[slug].astro       — страница кейса /work/<slug>/ по src/data/cases.ts (docs/wiki/case.md)
src/layouts/Base.astro            — каркас страницы: head (карточка ссылки, иконки — docs/wiki/seo.md), шапка, подвал
src/components/layout/Header.astro — шапка и меню
src/components/layout/Footer.astro — подвал
src/components/home/              — блоки главной и общие части: кадр, окно браузера, карточка контакта, метки (docs/wiki/home.md)
src/components/case/              — блоки страницы кейса (docs/wiki/case.md)
src/data/                         — тексты, работы, ссылки и контакты главной и кейсов (cases.ts); порядок разделов и меню
src/styles/tokens.css             — дизайн-токены, единственный источник (витрина docs/design/system.html читает его же)
src/styles/base.css               — сброс, текст, .container, заголовки, кнопки .btn / .btn-primary / .btn-ghost / .btn-sm,
                                    подпись .eyebrow, скрытый текст .visually-hidden, scroll-padding-top, prefers-reduced-motion
src/lib/paths.ts                  — withBase(): внутренние ссылки с учётом подпапки
src/lib/links.ts                  — resolveLink() и assetUrl(): ссылки и картинки из src/data/ → адреса (внешние — в новой вкладке)
src/lib/cases.ts                  — кейсы: проверка slug, адрес страницы, порядок «как на главной», следующий для «Next work»
src/lib/og.ts                     — карточка ссылки: размер 1200×630, путь у страницы (ogImagePath); список иконок
public/                           — файлы как есть: иконки сайта, карточки ссылки public/og/ (docs/wiki/seo.md)
scripts/site-env.mjs              — чтение SITE_URL и BASE_PATH (общее для конфига и снимков)
scripts/shots.mjs                 — снимки экрана и автопроверки (npm run shots)
scripts/og.mjs                    — карточки ссылки 1200×630 в public/og/ и их проверка (npm run og)
scripts/icons.mjs                 — иконки сайта в public/ и их проверка (npm run icons)
scripts/images.mjs                — общее для og/icons/shots: .ts из Node, токены, шрифты, PNG, ICO, Chrome
.github/workflows/deploy.yml      — выкладка на GitHub Pages
```

Шрифты — локально из `@fontsource/inter` (400/500/600) и `@fontsource/space-grotesk` (500/600/700), внешних запросов нет. Браузер качает только нужный набор знаков (латиница).

## Команды

Нужен Node.js ≥ 22.23 (стоит v26). Первый раз — `npm install`.

| Команда | Что делает |
|---|---|
| `npm run dev` | dev-сервер с автообновлением, http://localhost:4321 |
| `npm run build` | сборка в `dist/` |
| `npm run preview` | открыть собранный `dist/` локально |
| `npm run check` | проверка карточек ссылки и иконок (`og.mjs --check`, `icons.mjs --check`: есть, нужного размера, свежие) + `astro check` (типы; падает и на предупреждениях) + `astro build` |
| `npm run shots` | сборка + снимки + проверки (ниже). `npm run shots -- --no-build` — взять готовый `dist/` |
| `npm run og` | перерисовать устаревшие карточки ссылки в `public/og/` (`-- --force` — все, `-- --check` — только проверить); нужен Chrome |
| `npm run icons` | то же для иконок сайта в `public/` |

Карточки ссылки рисуются из данных и лежат в репозитории готовыми. Поменял тексты главной, работы Selected work, кейсы или ник Telegram — `npm run og`, иначе `npm run check` упадёт («устарела»). Когда ещё — `docs/wiki/seo.md`.

## Снимки экрана (`npm run shots`)

1. Проверяет карточки ссылки и иконки (`og.mjs --check`, `icons.mjs --check`, как `npm run check`), собирает сайт (или берёт `dist/` с `--no-build`).
2. Поднимает маленький статический сервер над `dist/` на свободном порту — по адресу `<BASE_PATH>/`, как на GitHub Pages. Так видно, что ссылки и файлы учитывают подпапку:
   - PowerShell: `$env:BASE_PATH = 'repo'; npm run shots; Remove-Item Env:BASE_PATH`
   - Git Bash: `BASE_PATH=repo npm run shots` — без начальной косой черты: Git Bash превращает `/repo` в путь Windows (`C:/Program Files/Git/repo`).
3. Открывает страницу в установленном Google Chrome через `playwright-core` (`channel: 'chrome'`; браузеры Playwright не качаются). Другой Chrome — переменная `CHROME_PATH` с путём к exe.
4. Сохраняет в `shots/` (папка в `.gitignore`):
   - `home-390.png`, `home-1280.png`, `home-1920.png` — вся страница;
   - `home-390-menu.png` — экран 390 с открытым меню;
   - `case-go-fashion-390.png`, `case-go-fashion-1280.png`, `case-go-fashion-1920.png` — страница кейса Go Fashion;
   - `case-<slug>-1280.png` — остальные кейсы (сейчас `case-ai-short-film-1280.png`).
   Кейсы берутся из сборки (`dist/work/<slug>/`) и проверяются все и на всех трёх ширинах; снимаются — как выше. Старые `case-*.png` в начале прогона удаляются — снимок удалённого кейса не останется.
5. Падает с ошибкой (код 1), если:
   - есть горизонтальная прокрутка (`scrollWidth > clientWidth`) — на любой ширине и с открытым меню; в ошибке — элементы, которые вылезают;
   - файл страницы не загрузился (HTTP ≥ 400, без исключений — иконки есть с T-008), ошибка JS или ошибка в консоли;
   - на 390 меню не открывается (клик, Enter) или не закрывается (Escape, уход фокуса, клик по пункту), фокус не вернулся на кнопку после Escape, Tab с кнопки не ведёт в пункты;
   - на 1280/1920 разделы не видны или видна кнопка меню;
   - ссылка-якорь (в шапке, меню или на странице) ведёт на несуществующий или невидимый блок;
   - после перехода по якорю из шапки верх раздела или его заголовок под шапкой (запас 2px: линия шапки 1px + округление прокрутки) или заголовок не в окне — на всех трёх ширинах;
   - H1 не один, уровни заголовков перескакивают (H2 → H4), у `<img>` нет `alt` или у `role="img"` нет `aria-label`, ссылка в новую вкладку без `rel="noopener"`, ссылка без адреса или на `#`;
   - ссылка на другую страницу сайта (с главной — карточки работ и «View case»; с кейса — «← All work», «Next work», шапка) отвечает не 200 или её якорь (`/#work`) не найден / не виден на той странице;
   - у кейса заголовок вкладки не «<H1> — Case study · Damir» или `description` не равен лиду; на 390 меню кейса не открывается кликом или не закрывается по Escape (пункт не нажимаем — он увёл бы на главную; полная проверка меню — на главной); на 1280/1920 разделы шапки не видны;
   - «Next work» не обходит все кейсы по кругу или идёт не в порядке главной; кейс один, а карточка есть; главная ссылается на кейс, которого нет в сборке;
   - карточки ссылки или иконки устарели или их нет (проверка в начале);
   - в `<head>` главной или кейса: тега `og:*`, `twitter:card`, `theme-color`, `canonical` нет или их несколько; `og:title`/`og:description` не равны `title`/`description`; `og:url` ≠ `canonical` или не полный адрес этой страницы (с подпапкой; при заданном `SITE_URL` — на нём); `og:image` — не полный адрес своей карточки (`og/home.png`, `og/<slug>.png`), не открывается или не 1200×630; иконка из `src/lib/og.ts` не подключена, не открывается или не того размера; `favicon.ico` не открывается (подробно — `docs/wiki/seo.md`).
   Якоря шапки на странице кейса ведут на главную (`/#work`) — их проверяет пункт про другие страницы, а не проверка «раздел не под шапкой».

Высота окна 900px: если страница короче, снимок — 900px.

## Выкладка (GitHub Pages)

`.github/workflows/deploy.yml` запускается при пуше в `main` и вручную (Run workflow):

1. `actions/checkout@v7`.
2. `withastro/action@v6` (Node 24): ставит зависимости (npm, определяется по `package-lock.json`), запускает `npm run check` (проверка типов + сборка) и загружает `dist/` как артефакт Pages. С ошибкой типов сайт не выкладывается.
3. `actions/deploy-pages@v5` публикует артефакт в окружение `github-pages`.

Права: у workflow — только чтение кода; `pages: write` и `id-token: write` есть лишь у job `deploy`, где не ставятся npm-пакеты.

Один раз в репозитории: Settings → Pages → Source: **GitHub Actions**. Lock-файл `package-lock.json` должен быть в репозитории — по нему action ставит зависимости.

### Переменные

| Переменная | Где задать | По умолчанию в workflow | Локально по умолчанию |
|---|---|---|---|
| `SITE_URL` — адрес сайта без подпапки | Settings → Secrets and variables → Actions → **Variables** | `https://<владелец>.github.io` | не задан |
| `BASE_PATH` — подпапка | там же | `/`, если репозиторий называется `<владелец>.github.io`; иначе `/<имя репозитория>` | `/` |

- Репозиторий `<ник>.github.io` → сайт `https://<ник>.github.io/`, переменные не нужны.
- Любой другой репозиторий → `https://<ник>.github.io/<репо>/`, переменные тоже не нужны.
- Свой домен (потом, решает владелец) → `SITE_URL=https://домен`, `BASE_PATH=/` и файл `public/CNAME`.

`BASE_PATH` можно писать с косой чертой или без (`repo`, `/repo`, `/repo/` — одно и то же; см. `scripts/site-env.mjs`). Переменные читаются из окружения процесса; файл `.env` Astro для конфига не читает.

## Правила для следующих задач

- Новая страница — на `Base` (`title`, `description`, `image` — карточка ссылки `ogImagePath()`, `type` — через props). Своя карточка — шаблон в `scripts/og.mjs` и `npm run og` (`docs/wiki/seo.md`).
- Тексты, работы, ссылки — в `src/data/`, не в вёрстке (`docs/wiki/home.md`). Ссылки и картинки из данных — через `resolveLink()` / `assetUrl()` из `src/lib/links.ts`.
- Внутренние ссылки и пути к файлам — только через `withBase()` из `src/lib/paths.ts` (`withBase('#work')`, `withBase(casePath('go-fashion'))` → `/work/go-fashion/`). Ссылка вида `/...` сломается, когда сайт живёт в подпапке. Ссылки на кейсы из данных — `work/<slug>` через `resolveLink()` (сама добавит косую черту и проверит, что кейс есть).
- Цвета, шрифты, отступы, скругления — токены из `src/styles/tokens.css`. Числа без токена (например 14px, 28px, 38px в шапке и подвале) — только как в одобренном макете; повторяется в нескольких местах — заводим токен, сначала в `docs/design/system.md`.
- Стили раздела — в его компоненте (`<style>` в `.astro` — действуют только на этот компонент). Общее — в `base.css`.
- `overflow-x: hidden` на `body` не ставим: переполнение должно быть видно и ловиться `npm run shots`. Если что-то вылезает намеренно (свечение) — обрезать в самом разделе (`overflow: clip`).

## Подводные камни

- Путь проекта с пробелом, кириллицей и скобками (`D:\Видео (PR)\portfolio-site`) — сборка, `astro check`, dev-сервер и снимки работают (проверено 25.11). См. `docs/known-issues.md`.
- Astro при включённой телеметрии запускает `git rev-list` для анонимного id проекта. Где git трогать нельзя — `ASTRO_TELEMETRY_DISABLED=1` в окружении.
- `og.mjs`, `icons.mjs` и `shots.mjs` читают `src/data/*.ts` и `src/lib/og.ts` прямо из Node (Node ≥ 22.18 снимает типы сам; Node 22–24 может напечатать ExperimentalWarning — это не ошибка). В этих файлах — только то, что Node умеет без сборки: без `enum` и `import.meta.env` (`docs/wiki/seo.md`).
- `@astrojs/check` пока поддерживает TypeScript только 5–6, поэтому `typescript` закреплён на 6.x (последний — 7).
- Astro собирает CSS под «esnext» и выбрасывает префиксы (`-webkit-backdrop-filter` нужен Safari до 18). Поэтому в `astro.config.mjs` задан `vite.build.cssTarget` — та же «широко доступная база», что у Vite по умолчанию (Chrome/Edge 111, Firefox 114, Safari/iOS 16.4).
- `npm run check` падает на предупреждениях `astro check`, но не `astro build` — предупреждения сборки смотреть глазами (сейчас их нет).
- Выпадающий список меню — на сплошном `--bg`, без своего размытия: внутри шапки с `backdrop-filter` второе размытие не видит страницу под собой.
