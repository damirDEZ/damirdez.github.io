// @ts-check
// Карточки ссылки 1200×630 (og:image) по макету docs/design/og/og.html (Дамир 25.11):
// главная — public/og/home.png, каждый кейс — public/og/<slug>.png. Тексты и кадры — из src/data/.
//
//   npm run og              — нарисовать недостающие и устаревшие карточки, удалить карточки удалённых кейсов
//   npm run og -- --force   — перерисовать все
//   npm run og -- --check   — только проверить (входит в npm run check): у главной и у каждого кейса есть карточка
//                             1200×630, лишних нет, и каждая нарисована из текущих данных и шаблона
//
// «Свежесть»: в каждую PNG записан отпечаток (SHA-256) HTML, из которого она нарисована (scripts/images.mjs → hashKey).
// HTML собирается из данных, токенов, градиентов кадра, шаблона ниже, шрифтов и картинок из public/ —
// поменялось что-то из этого, отпечаток не совпадёт, и --check упадёт. Подробности — docs/wiki/seo.md.

import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  escapeHtml,
  fontFaces,
  hashKey,
  importTs,
  launchChrome,
  loadHtml,
  publicDir,
  readGradients,
  readPng,
  inputsHash,
  tokensCss,
  withPngText,
} from './images.mjs';

/** @typedef {import('../src/data/types.ts').Media} Media */

/** @type {typeof import('../src/data/link-card.ts')} */
const { linkCard } = await importTs('src/data/link-card.ts');
/** @type {typeof import('../src/data/hero.ts')} */
const { hero } = await importTs('src/data/hero.ts');
/** @type {typeof import('../src/data/contacts.ts')} */
const { contacts } = await importTs('src/data/contacts.ts');
/** @type {typeof import('../src/data/selected-work.ts')} */
const { selectedWork } = await importTs('src/data/selected-work.ts');
/** @type {typeof import('../src/data/cases.ts')} */
const { cases } = await importTs('src/data/cases.ts');
/** @type {typeof import('../src/lib/og.ts')} */
const { ogImagePath, ogImageSize } = await importTs('src/lib/og.ts');

const { width, height } = ogImageSize;
/** Настройки снимка — входят в отпечаток (inputsHash): масштаб 1, ровно 1200×630, без прозрачности. */
const shot = { deviceScaleFactor: 1, width, height, transparent: false };
const outDir = path.join(publicDir, 'og');
const gradients = readGradients();

/** Шрифты карточки — те же, что на сайте (@fontsource), с файлами внутри HTML. */
const fontsCss = [
  fontFaces('space-grotesk', 600),
  fontFaces('space-grotesk', 700),
  fontFaces('inter', 400),
  fontFaces('inter', 500),
  fontFaces('inter', 600),
].join('\n');
/** Каких шрифтов дождаться перед снимком. */
const fonts = [
  '700 30px "Space Grotesk"',
  '600 66px "Space Grotesk"',
  '400 24px "Inter"',
  '500 22px "Inter"',
  '600 15px "Inter"',
];

/** Стили — из макета docs/design/og/og.html (.og, .fr); отличия: без скругления углов (мессенджер скругляет сам), обложка кейса. */
const css = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${width}px;height:${height}px;overflow:hidden;background:var(--bg)}
body{color:var(--text);font:16px/1.6 "Inter",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.og{width:${width}px;height:${height}px;position:relative;overflow:hidden;background:var(--bg);display:flex;flex-direction:column;padding:52px 64px 56px}
.og::before{content:"";position:absolute;inset:0;background:radial-gradient(55% 75% at 88% 10%,rgba(255,138,61,.22),transparent 70%),radial-gradient(45% 60% at 0% 100%,rgba(143,166,255,.10),transparent 70%)}
.og>*{position:relative}
.top{display:flex;justify-content:space-between;align-items:center}
.logo{font-family:"Space Grotesk",sans-serif;font-weight:700;font-size:30px;letter-spacing:.02em}
.logo span{color:var(--accent)}
.tg{font-size:22px;color:var(--text-2)}
.tg b{color:var(--text);font-weight:500}
h1{font-family:"Space Grotesk",sans-serif;font-weight:600;letter-spacing:-.025em;line-height:1.04;font-size:66px;margin:44px 0 18px;max-width:1040px}
h1 em{font-style:normal;color:var(--accent)}
p{font-size:24px;color:var(--text-2);white-space:nowrap;overflow:hidden}
.frames{margin-top:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.fr{position:relative;height:150px;border-radius:16px;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.fr::after{content:"";position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 40%,transparent 40%,rgba(0,0,0,.5))}
.fr.has-image::after{box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.fr img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.fr span{position:absolute;left:14px;bottom:12px;z-index:1;font-size:15px;font-weight:600;padding:4px 10px;border-radius:7px;background:rgba(10,10,12,.7)}
.cover{flex:1 1 auto;height:auto;min-height:0;margin-top:44px}
`;

const imageTypes = /** @type {Record<string, string>} */ ({
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
});

/**
 * Кадр: картинка (из public/ — внутрь HTML, чтобы её замена меняла отпечаток; https://… — по адресу) или градиент-заглушка.
 * @param {Media} media
 * @param {{ label?: string, className?: string, position?: string }} [options]
 */
function frameHtml(media, { label, className = '', position = 'center' } = {}) {
  let inner = '';
  let background = '';
  if (media.image) {
    let src = media.image;
    if (!/^https?:\/\//i.test(src)) {
      const file = path.join(publicDir, src);
      const type = imageTypes[path.extname(file).toLowerCase()];
      if (!type) throw new Error(`картинка ${src}: неизвестный формат (нужен ${Object.keys(imageTypes).join(', ')})`);
      if (!existsSync(file)) throw new Error(`картинка ${src}: нет файла public/${src}`);
      src = `data:${type};base64,${readFileSync(file).toString('base64')}`;
    }
    inner = `<img src="${escapeHtml(src)}" alt="" style="object-position:${position}">`;
  } else {
    background = gradients[media.gradient];
    if (!background) throw new Error(`градиент ${media.gradient}: нет в src/components/home/Frame.astro`);
  }
  const classes = ['fr', className, media.image ? 'has-image' : ''].filter(Boolean).join(' ');
  return `<div class="${classes}"${background ? ` style="background:${escapeHtml(background)}"` : ''}>${inner}${
    label ? `<span>${escapeHtml(label)}</span>` : ''
  }</div>`;
}

/**
 * Вся карточка.
 * @param {{ title: string, subtitle: string, media: string }} parts title — HTML заголовка, media — HTML кадров
 */
function cardHtml({ title, subtitle, media }) {
  const telegram = contacts.telegram
    ? `${escapeHtml(linkCard.telegramLabel)} <b>@${escapeHtml(contacts.telegram.handle)}</b>`
    : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
${fontsCss}
${tokensCss(['bg', 'text', 'text-2', 'accent'])}
${css}
</style></head><body><div class="og">
<div class="top"><div class="logo">DAMIR<span>.</span></div><div class="tg">${telegram}</div></div>
<h1>${title}</h1>
<p>${escapeHtml(subtitle)}</p>
${media}
</div></body></html>`;
}

/** Карточки, которые должны быть: главная и каждый кейс. */
function expectedCards() {
  // Кадры — первые три работы Selected work; подпись — у самой работы (cardLabel, иначе начало kind),
  // поэтому при перестановке работ подписи едут вместе с картинками.
  const frames = selectedWork.items
    .slice(0, 3)
    .map((item) => frameHtml(item.media, { label: item.cardLabel ?? item.kind?.split(' · ')[0] }));
  const home = {
    name: 'главная',
    file: ogImagePath(),
    html: cardHtml({
      title: `${escapeHtml(linkCard.title.start)}<em>${escapeHtml(linkCard.title.accent)}</em>`,
      subtitle: hero.eyebrow,
      // Работ меньше трёх — кадры делят ширину поровну.
      media: frames.length
        ? `<div class="frames" style="grid-template-columns:repeat(${frames.length},1fr)">${frames.join('')}</div>`
        : '',
    }),
  };
  const caseCards = cases.map((item) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) throw new Error(`src/data/cases.ts: slug «${item.slug}» — только a–z, 0–9 и дефис`);
    const file = ogImagePath(item.slug);
    if (file === home.file) throw new Error(`src/data/cases.ts: slug «${item.slug}» занят карточкой главной (${file})`);
    return {
      name: `кейс ${item.slug}`,
      file,
      html: cardHtml({
        title: escapeHtml(item.title),
        subtitle: item.eyebrow,
        // У сайта на обложке важнее верх страницы, у ролика — середина кадра.
        media: frameHtml(item.cover.media, { className: 'cover', position: item.cover.type === 'browser' ? 'top' : 'center' }),
      }),
    };
  });
  return [home, ...caseCards].map((card) => ({ ...card, hash: inputsHash(card.html, shot) }));
}

/**
 * Помещается ли текст: заголовок — до двух строк, подпись — в строку, кадры не наезжают на текст и не ниже поля.
 * @param {import('playwright-core').Page} page
 */
function layoutProblems(page) {
  return page.evaluate(() => {
    /** @type {string[]} */
    const problems = [];
    const card = /** @type {HTMLElement} */ (document.querySelector('.og'));
    const h1 = /** @type {HTMLElement} */ (document.querySelector('h1'));
    const p = /** @type {HTMLElement} */ (document.querySelector('p'));
    const lines = Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight));
    if (lines > 2) problems.push(`заголовок в ${lines} строки — помещаются две, сократи текст`);
    if (p.scrollWidth > p.clientWidth + 0.5) problems.push(`подпись «${p.textContent}» не помещается в строку`);
    const media = document.querySelector('.frames, .cover');
    if (media) {
      const rect = media.getBoundingClientRect();
      const bottom = card.getBoundingClientRect().bottom - parseFloat(getComputedStyle(card).paddingBottom);
      if (rect.top - p.getBoundingClientRect().bottom < 24) problems.push('кадры наезжают на текст');
      if (rect.height < 150) problems.push(`кадр низкий (${Math.round(rect.height)}px, нужно от 150)`);
      if (rect.bottom > bottom + 0.5) problems.push('кадры не помещаются в карточку');
    }
    return problems;
  });
}

async function main() {
  const check = process.argv.includes('--check');
  const force = process.argv.includes('--force');
  const cards = expectedCards();
  const expectedFiles = new Set(cards.map((card) => path.basename(card.file)));

  /** @type {Map<string, string>} файл → что с ним не так */
  const stale = new Map();
  for (const card of cards) {
    const file = path.join(publicDir, card.file);
    if (!existsSync(file)) {
      stale.set(card.file, 'нет файла');
      continue;
    }
    try {
      const png = readPng(readFileSync(file));
      if (png.width !== width || png.height !== height) stale.set(card.file, `${png.width}×${png.height}, нужно ${width}×${height}`);
      else if (png.text[hashKey] !== card.hash) stale.set(card.file, 'устарела — данные, шаблон, шрифты или настройки снимка поменялись');
    } catch (error) {
      stale.set(card.file, error instanceof Error ? error.message : String(error));
    }
  }
  const extra = existsSync(outDir)
    ? readdirSync(outDir).filter((name) => name.toLowerCase().endsWith('.png') && !expectedFiles.has(name))
    : [];

  if (check) {
    const problems = [
      ...[...stale].map(([file, why]) => `public/${file}: ${why}`),
      ...extra.map((name) => `public/og/${name}: лишняя — такой страницы нет (кейс удалён или переименован)`),
    ];
    if (problems.length) {
      console.error(`Карточки ссылки:\n  ${problems.join('\n  ')}\nПерерисуй: npm run og`);
      process.exit(1);
    }
    console.log(`Карточки ссылки: ${cards.map((card) => card.file).join(', ')} — ${width}×${height}, свежие — ок`);
    return;
  }

  mkdirSync(outDir, { recursive: true });
  for (const name of extra) {
    unlinkSync(path.join(outDir, name));
    console.log(`  public/og/${name} — удалена (такой страницы нет)`);
  }
  const todo = force ? cards : cards.filter((card) => stale.has(card.file));
  if (!todo.length) {
    console.log('Карточки ссылки свежие — перерисовывать нечего (все заново: npm run og -- --force)');
    return;
  }

  const browser = await launchChrome();
  try {
    const context = await browser.newContext({ deviceScaleFactor: shot.deviceScaleFactor });
    const page = await context.newPage();
    /** @type {string[]} */
    const problems = [];
    page.on('requestfailed', (request) => problems.push(`не загрузилось: ${request.url().slice(0, 120)}`));
    page.on('pageerror', (error) => problems.push(`ошибка JS: ${error.message}`));
    for (const card of todo) {
      problems.length = 0;
      const missing = await loadHtml(page, card.html, { width, height, fonts });
      if (missing.length) problems.push(`не загрузился шрифт: ${missing.join(', ')}`);
      problems.push(...(await layoutProblems(page)));
      if (problems.length) throw new Error(`${card.name} (${card.file}): ${problems.join('; ')}`);
      const png = await page.screenshot({
        clip: { x: 0, y: 0, width: shot.width, height: shot.height },
        omitBackground: shot.transparent,
        animations: 'disabled',
      });
      writeFileSync(path.join(publicDir, card.file), withPngText(png, hashKey, card.hash));
      console.log(`  public/${card.file} — ${card.name}, ${width}×${height}`);
    }
    await context.close();
  } finally {
    await browser.close();
  }
  console.log('Карточки нарисованы. Посмотри их глазами: public/og/.');
}

main().catch((error) => {
  console.error(`\nnpm run og: ОШИБКА — ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
