// @ts-check
// Иконки сайта по макету docs/design/og/og.html (Дамир 25.11): «D» Space Grotesk 700 цветом --text
// и оранжевая точка --accent на --bg, скругление ~22% стороны, тонкая рамка от 64px.
//
//   npm run icons              — нарисовать недостающие и устаревшие иконки в public/
//   npm run icons -- --force   — перерисовать все
//   npm run icons -- --check   — только проверить (входит в npm run check): файлы есть, размеры верные,
//                                иконки нарисованы из текущего шаблона, токенов и шрифта
//
// Список файлов и размеров — src/lib/og.ts (siteIcons, faviconIco). Подробности — docs/wiki/seo.md.

import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  buildIco,
  fontFaces,
  hashKey,
  importTs,
  launchChrome,
  loadHtml,
  publicDir,
  readIco,
  readPng,
  inputsHash,
  tokensCss,
  withPngText,
} from './images.mjs';

/** @type {typeof import('../src/lib/og.ts')} */
const { siteIcons, faviconIco } = await importTs('src/lib/og.ts');

/**
 * Размеры из макета: 180 — с рамкой (в макете рамка от 64px), 32 и 16 — без. 48 в макете нет — между 32 и 64 (r14, кегль 38), без рамки.
 * radius — скругление, font — кегль «D.», lift — поднять букву над центром (padding-bottom), border — рамка 1px.
 * @type {Record<number, { radius: number, font: number, lift: number, border: boolean }>}
 */
const styles = {
  16: { radius: 4, font: 11, lift: 0, border: false },
  32: { radius: 7, font: 20, lift: 0, border: false },
  48: { radius: 10, font: 29, lift: 1, border: false },
  180: { radius: 40, font: 108, lift: 6, border: true },
};

/** Цвет рамки — как в макете (#2a2a33, между --line и --line-strong). */
const borderColor = '#2a2a33';

/**
 * HTML иконки. Значок на экран телефона (apple-touch-icon) — без прозрачности: iOS сам скругляет углы,
 * а прозрачные залил бы чёрным; поэтому вокруг скругления — тот же --bg. Иконки вкладки — с прозрачными углами.
 * @param {{ size: number, rel: string }} icon
 */
function iconHtml({ size, rel }) {
  const style = styles[size];
  if (!style) throw new Error(`иконка ${size}px: нет размеров в styles (scripts/icons.mjs)`);
  const opaque = rel === 'apple-touch-icon';
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontFaces('space-grotesk', 700)}
${tokensCss(['bg', 'text', 'accent'])}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${size}px;height:${size}px;overflow:hidden;background:${opaque ? 'var(--bg)' : 'transparent'}}
.icon{width:${size}px;height:${size}px;border-radius:${style.radius}px;display:flex;align-items:center;justify-content:center;background:var(--bg);border:${style.border ? `1px solid ${borderColor}` : '0'};font-family:"Space Grotesk",sans-serif;font-weight:700;color:var(--text);line-height:1;font-size:${style.font}px;letter-spacing:-.06em;padding-bottom:${style.lift}px;-webkit-font-smoothing:antialiased}
.icon i{font-style:normal;color:var(--accent)}
</style></head><body><div class="icon">D<i>.</i></div></body></html>`;
}

/** @param {string} file */
const publicPath = (file) => path.join(publicDir, file);

/**
 * Проблемы с одной PNG-иконкой: нет файла, не тот размер, нарисована из другого HTML.
 * @param {Buffer} buffer
 * @param {number} size
 * @param {string} hash
 * @param {string} label
 */
function pngProblems(buffer, size, hash, label) {
  try {
    const png = readPng(buffer);
    if (png.width !== size || png.height !== size) return [`${label}: ${png.width}×${png.height}, нужно ${size}×${size}`];
    if (png.text[hashKey] !== hash) return [`${label}: устарела (шаблон, цвета, шрифт или настройки снимка поменялись)`];
    return [];
  } catch (error) {
    return [`${label}: ${error instanceof Error ? error.message : error}`];
  }
}

async function main() {
  const check = process.argv.includes('--check');
  const force = process.argv.includes('--force');
  const icons = siteIcons.map((icon) => {
    const html = iconHtml(icon);
    // Настройки снимка — тоже в отпечаток: масштаб 1, ровно size×size; значок для телефона — без прозрачности.
    const shot = { deviceScaleFactor: 1, size: icon.size, transparent: icon.rel !== 'apple-touch-icon' };
    return { ...icon, html, shot, hash: inputsHash(html, shot) };
  });
  const icoIcons = icons.filter((icon) => icon.rel === 'icon');
  // Иконки размеров, которых больше нет в siteIcons (src/lib/og.ts).
  const expectedFiles = new Set(icons.map((icon) => icon.file));
  const extra = existsSync(publicDir)
    ? readdirSync(publicDir).filter((name) => /^(favicon-\d+|apple-touch-icon[\w-]*)\.png$/.test(name) && !expectedFiles.has(name))
    : [];

  /** @type {string[]} */
  const problems = [];
  for (const icon of icons) {
    const file = publicPath(icon.file);
    if (!existsSync(file)) problems.push(`public/${icon.file}: нет файла`);
    else problems.push(...pngProblems(readFileSync(file), icon.size, icon.hash, `public/${icon.file}`));
  }
  const icoFile = publicPath(faviconIco);
  if (!existsSync(icoFile)) {
    problems.push(`public/${faviconIco}: нет файла`);
  } else {
    try {
      const inside = readIco(readFileSync(icoFile));
      const sizes = inside.map((image) => image.size).join(', ');
      const expected = icoIcons.map((icon) => icon.size).join(', ');
      if (sizes !== expected) problems.push(`public/${faviconIco}: внутри ${sizes || 'пусто'}, нужно ${expected}`);
      else inside.forEach((image, i) => problems.push(...pngProblems(image.png, image.size, icoIcons[i].hash, `public/${faviconIco} (${image.size}px)`)));
    } catch (error) {
      problems.push(`public/${faviconIco}: ${error instanceof Error ? error.message : error}`);
    }
  }

  problems.push(...extra.map((name) => `public/${name}: лишняя — такого размера нет в siteIcons (src/lib/og.ts)`));

  if (check) {
    if (problems.length) {
      console.error(`Иконки сайта:\n  ${problems.join('\n  ')}\nПерерисуй: npm run icons`);
      process.exit(1);
    }
    console.log(`Иконки сайта: ${[...icons.map((icon) => icon.file), faviconIco].join(', ')} — на месте и свежие — ок`);
    return;
  }

  if (!force && !problems.length) {
    console.log('Иконки сайта свежие — перерисовывать нечего (все заново: npm run icons -- --force)');
    return;
  }

  mkdirSync(publicDir, { recursive: true });
  for (const name of extra) {
    unlinkSync(publicPath(name));
    console.log(`  public/${name} — удалена (такого размера нет)`);
  }
  const browser = await launchChrome();
  try {
    const context = await browser.newContext({ deviceScaleFactor: 1 });
    const page = await context.newPage();
    /** @type {Map<number, Buffer>} */
    const pngs = new Map();
    for (const icon of icons) {
      const missing = await loadHtml(page, icon.html, {
        width: icon.size,
        height: icon.size,
        fonts: [`700 ${styles[icon.size].font}px "Space Grotesk"`],
      });
      if (missing.length) throw new Error(`${icon.file}: не загрузился шрифт ${missing.join(', ')}`);
      const shot = await page.screenshot({
        clip: { x: 0, y: 0, width: icon.shot.size, height: icon.shot.size },
        omitBackground: icon.shot.transparent,
        animations: 'disabled',
      });
      const png = withPngText(shot, hashKey, icon.hash);
      writeFileSync(publicPath(icon.file), png);
      pngs.set(icon.size, png);
      console.log(`  public/${icon.file} — ${icon.size}×${icon.size}`);
    }
    writeFileSync(icoFile, buildIco(icoIcons.map((icon) => ({ size: icon.size, png: /** @type {Buffer} */ (pngs.get(icon.size)) }))));
    console.log(`  public/${faviconIco} — ${icoIcons.map((icon) => icon.size).join(', ')}`);
    await context.close();
  } finally {
    await browser.close();
  }
  console.log('Иконки нарисованы. Посмотри их глазами: открой файлы в public/.');
}

main().catch((error) => {
  console.error(`\nnpm run icons: ОШИБКА — ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
