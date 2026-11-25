<!-- wiki:code src/pages/index.astro src/components/home/ src/data/ -->
# Главная страница

Сверено с кодом: 2026-11-25 (T-003, T-004, T-008; коммита ещё нет).

Главная собрана по одобренному макету `docs/design/home/home.html` (Дамир 24.11). Все тексты, работы, ссылки и контакты лежат в `src/data/`, компоненты `src/components/home/` их только рисуют. Пока почти все работы — заглушки: градиенты g1…g7 из макета вместо картинок, тексты из макета.

## Как устроена

1. `src/pages/index.astro` — страница на каркасе `Base`: первый экран (`Hero`), потом разделы по списку `visibleSections` из `src/data/sections.ts`; карточка ссылки — `public/og/home.png` (`docs/wiki/seo.md`).
2. `src/data/sections.ts` — единственный источник порядка разделов, их видимости, номеров и пунктов меню шапки:
   - раздел показывается, только если в нём есть работы (например, `videos.ts` → `items` не пуст; Websites — есть хотя бы один кейс, одной полосы «New project» мало); иначе нет ни блока, ни пункта меню;
   - блок контакта виден всегда — на него ведёт «Hire me» в шапке;
   - номер в подписи («01 — Video») ставится сам по порядку видимых разделов с `numbered: true` — скрыли Video, и Websites станет «01»;
   - шапка (`src/components/layout/Header.astro`) берёт пункты меню отсюда же (`navSections`).
3. Порядок на странице: первый экран → Selected work `#work` → Video `#video` → Websites `#web` → Game dev `#game` → AI `#ai` → How I work `#how` (в меню нет) → контакт `#contact`.
4. Отступ под липкую шапку при переходе по якорю — `scroll-padding-top` в `src/styles/base.css` (72px, ≤640px — 64px).

### Компоненты (`src/components/home/`)

| Файл | Что рисует |
|---|---|
| `Hero.astro` | первый экран: подпись, H1 с оранжевой частью, лид, кнопки, «Daily tools», кадр шоурила, свечение на всю ширину |
| `SelectedWork.astro` | 3 избранные работы, первая — крупно (4:3) |
| `VideoSection.astro` | сетка роликов (первые `maxOnHome`) |
| `Websites.astro` | кейс в рамке браузера (Task / What we did / Result, метки, кнопки «View case» и «Live site ↗») + полоса «New project in progress» |
| `GameDev.astro` | большой кадр + маленькие, название, список Done / In progress / Next |
| `AiSection.astro` | карточки инструментов + обложки «Thumbnails & covers» |
| `HowIWork.astro` | 3 пункта «How I work» |
| `Contact.astro` | блок контакта `#contact`: раздел с карточкой контакта (`ContactCard`) и текстами из `contact.ts` |
| `ContactCard.astro` | карточка контакта: «Open for projects», заголовок, строка, кнопки, адрес почты текстом; общая с кейсом (там `compact` и заголовок под тип работы) |
| `Section.astro` | обёртка раздела: `<section id>`, отступы, линия сверху, контейнер; общая с кейсом (там без `id`, `narrow`, `flushTop`) |
| `SectionHead.astro` | подпись с номером, H2 (`id="<раздел>-title"`), пояснение справа |
| `Frame.astro` | кадр: картинка или градиент, виньетка, Play, длительность, бейдж, подпись заглушки, заголовок обложки; для кейса — экран телефона (`variant="phone"`) и обложка 16:8.5 (`cover`) |
| `BrowserWindow.astro` | окно браузера: строка с точками и адресом + кадр; общее для Websites и страницы кейса |
| `WorkCard.astro` | карточка работы: кадр, тип, H3, описание, метки; есть ссылка — вся карточка ссылка |
| `Chips.astro` | метки; `ai: true` — оранжевая |
| `ContactButtons.astro` | кнопки Telegram (новая вкладка) и «Email me» (mailto:); `compact` — отступы из макета кейса |

Стили каждого блока — в его компоненте; общие `.eyebrow`, `.visually-hidden`, кнопки `.btn` — в `src/styles/base.css`. Числа — токены `tokens.css` или как в макете. `Section`, `Frame`, `BrowserWindow`, `ContactCard`, `ContactButtons`, `Chips` использует и страница кейса (`docs/wiki/case.md`) — меняя их, смотри снимки и главной, и кейсов.

## Где данные (`src/data/`)

| Файл | Что внутри |
|---|---|
| `types.ts` | общие типы: `Media` (кадр; градиенты `g1`…`g7` и `g3b`, `g3c` из макета кейса), `Chip`, `Badge`, `SectionHead`, отметки `placeholder` и `needsConfirmation` |
| `contacts.ts` | Telegram (`handle`, `url`) и почта — реальные; нет поля — нет кнопки |
| `hero.ts` | первый экран и шоурил |
| `selected-work.ts` | избранные работы |
| `videos.ts` | ролики; `maxOnHome` — сколько на главной (6); `caseUrl` — карточка ведёт на кейс |
| `websites.ts` | кейсы, подписи кнопок, полоса «новый проект» (`upcoming`) |
| `cases.ts` | страницы кейсов `/work/<slug>/` — `docs/wiki/case.md` |
| `game.ts` | игра (`project: null` — раздела нет) |
| `ai.ts` | инструменты и обложки |
| `how-i-work.ts` | пункты «How I work» |
| `contact.ts` | тексты блока контакта |
| `sections.ts` | порядок, видимость, номера, меню |
| `ui.ts` | подписи для экранного диктора («(opens in a new tab)», «Duration:») |
| `link-card.ts` | карточка ссылки главной: фраза, подпись «Telegram», имя сайта (`docs/wiki/seo.md`) |

Ссылки из данных превращает в адреса `src/lib/links.ts`:
- `https://…` — как есть, открывается в новой вкладке (`target="_blank" rel="noopener"`);
- `#web` — раздел главной; если раздел скрыт, ссылки нет;
- `work/go-fashion` — страница кейса → `/work/go-fashion/` (через `withBase()`, работает и в подпапке); кейса с таким `slug` нет в `cases.ts` — сборка падает;
- другое (`mailto:`, `tel:`, `//…`) — сборка падает с ошибкой: значит, в данных опечатка. Почта и Telegram — только в `contacts.ts`.

## Правила пустых данных

- Нет ссылки — нет кнопки (View case, Live site ↗, Watch ↗) и карточка не ссылка.
- Нет работ в разделе — нет раздела и пункта меню. Нет обложек — нет подзаголовка «Thumbnails & covers».
- Нет картинки — градиент-заглушка `gradient` и подпись `placeholderLabel`.
- Нет шоурила (`showreel` убран из `hero.ts`) — текст первого экрана на всю ширину.
- Кнопка Play — только вид, без действия (плеер — T-005).

## Как заменить заглушку реальной работой

Каждая заглушка в данных помечена `placeholder: true` — найти все: поиск `placeholder: true` по `src/data/`.

### Картинка (скриншот, кадр, обложка)

1. Положи файл в `public/` в папку по смыслу: `public/work/go-fashion.jpg`, `public/game/level-1.jpg`, `public/covers/devlog-1.jpg`. Кадры — 16:9 (первая работа в Selected work шире 1020px показывается 4:3, края обрежутся), лучше JPG/WebP шириной 1600–2000px.
2. В данных у этой работы в `media` добавь `image: 'work/go-fashion.jpg'` (путь от `public/`, без начальной `/`). Можно и полный адрес `https://…`.
3. Проверь `alt` — что на картинке, по-английски.
4. `gradient` оставь — он нужен на случай, если картинку уберут. `placeholderLabel` с картинкой не показывается, его можно удалить.
5. У обложек (`ai.ts` → `covers.items`) заголовок поверх кадра виден только на заглушке: на настоящей обложке текст уже нарисован.

### Ролик

1. Залей ролик на YouTube «по ссылке».
2. В `videos.ts` у ролика: `videoUrl: 'https://youtu.be/…'`, `duration: '2:47'`, обложка — `media.image` (как выше), `title`, `chips` (`ai: true` — оранжевая метка ИИ).
3. Пока нет плеера (T-005), карточка с `videoUrl` открывает ролик в новой вкладке. Шоурил — то же в `hero.ts` → `showreel.videoUrl`: появится ссылка «Watch ↗». Картинка шоурила грузится сразу (первый экран), остальные — по мере прокрутки.
4. Ролик в Selected work (`selected-work.ts`): ссылка — в `href`: `'work/ai-short-film'` — страница кейса (сейчас так), `'https://youtu.be/…'` — ролик в новой вкладке, `'#video'` — к разделу Video; длительность — `video: { duration: '2:47' }`.
5. Есть кейс ролика — `caseUrl: 'work/<slug>'` в `videos.ts`: карточка ведёт на кейс (а не на `videoUrl`). Сейчас так у «AI short film».

### Кейс сайта

В `websites.ts` → `cases`: `title`, `eyebrow`, `rows` (Task / What we did / Result), `chips`, `media.image` — снимок сайта.
- `caseUrl: 'work/go-fashion'` — кнопка «View case» на страницу кейса (есть; кейс — `src/data/cases.ts`, `docs/wiki/case.md`);
- `liveUrl: 'https://…'` — кнопка «Live site ↗» (новая вкладка);
- `browserLabel` — текст в строке адреса.
Полоса «New project in progress» — `upcoming`; убрать — удалить поле.

### Игра, инструменты, «How I work», избранное

- `game.ts`: `media` + `badge` (большой кадр), `shots` (маленькие кадры), `title`, `text`, `devlog` (статусы `Done` / `In progress` / `Next`; `Next` — оранжевым).
- `ai.ts`: `tools` (`monogram`, `name`, `text`), `covers.items`.
- `selected-work.ts`: `kind`, `title`, `description`, `chips`, `media`, `badge` (`live: true` — зелёная точка), `video` (Play и длительность), `href` (куда ведёт карточка: `work/<slug>` — кейс, `#раздел` или `https://…`), `cardLabel` (подпись кадра на карточке ссылки главной; на сайте не видна). Первая работа — крупная. Сейчас Go Fashion и мини-фильм ведут на свои кейсы, игра — на `#game`.

Заменил — сними `placeholder: true`. Потом `npm run check` и `npm run shots`, посмотри снимки.

Карточка ссылки главной (`public/og/home.png`) рисуется из `hero.ts` (роли — `eyebrow`), `contacts.ts` (ник Telegram) и первых трёх работ `selected-work.ts` (их картинки и подписи `cardLabel`). Поменял что-то из этого — `npm run og`, иначе `npm run check` упадёт («устарела»); подробно — `docs/wiki/seo.md`.

## Тексты, которые ждут подтверждения Дамира

Помечены в данных полем `needsConfirmation` (на сайте выводятся как обычно):
- `contact.ts` — «I usually reply within a day»;
- `how-i-work.ts` — «revisions included».

Подтвердит с материалами (T-009). Не подтвердит — поправить текст и убрать поле.

## Проверки

`npm run shots` (подробно — `docs/wiki/site.md`) для главной дополнительно проверяет:
- все якоря страницы (шапка, меню, карточки) ведут на существующие видимые блоки;
- после перехода по каждому якорю из шапки верх блока и его заголовок не под шапкой, заголовок виден;
- один H1, уровни заголовков не перескакивают, у кадров есть `alt` / `aria-label`, ссылки в новую вкладку — с `rel="noopener"`, нет ссылок без адреса или на `#`;
- ссылки на другие страницы (карточки работ, «View case») ведут на существующие страницы (ответ 200); по ним же определяется порядок кейсов для «Next work» (`docs/wiki/case.md`).

## Отличия от макета

- Нет кнопки «Live site ↗» и ссылки «Watch ↗» — в данных пока нет ссылок (правило «нет ссылки — нет кнопки»). Кнопка «View case» есть с T-004 — блок кейса той же высоты, что в макете.
- У «How I work» появился `id="how"` (в макете раздел без якоря; в меню его нет).
