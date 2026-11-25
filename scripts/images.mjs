// @ts-check
// Общие части для scripts/og.mjs, scripts/icons.mjs и scripts/shots.mjs:
// чтение данных сайта (TypeScript) из Node, токены и градиенты, шрифты @fontsource в HTML-шаблон,
// PNG (размер, «отпечаток» входных данных в текстовой записи), ICO, запуск Chrome.
// Как устроено — docs/wiki/seo.md.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { crc32 } from 'node:zlib';

export const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
export const publicDir = path.join(root, 'public');

/**
 * Ключ текстовой записи (tEXt) в PNG: в ней хранится отпечаток (SHA-256) HTML, из которого нарисована картинка,
 * и настроек снимка (inputsHash). HTML собирается из данных, токенов, градиентов, шаблона и шрифтов —
 * поменялось что-то из этого, поменяется и отпечаток.
 */
export const hashKey = 'inputs-sha256';

/** @param {string | Buffer} value */
export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Отпечаток картинки: HTML и настройки снимка (флаги Chrome, масштаб, размер, прозрачность) —
 * поменялись настройки, картинку тоже надо перерисовать.
 * @param {string} html
 * @param {Record<string, unknown>} settings
 */
export function inputsHash(html, settings) {
  return sha256(`${JSON.stringify({ chromeArgs, ...settings })}\n${html}`);
}

/** @param {string} value */
export function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

// ── Данные сайта (TypeScript) ────────────────────────────────────────────────

let hooked = false;

/**
 * Импорт .ts-файла проекта (src/data/*.ts, src/lib/og.ts). Node ≥ 22.18 сам снимает типы;
 * импорты без расширения ('./types'), как их пишет Astro, Node не находит — подставляем «.ts».
 * @param {string} relativePath путь от корня проекта
 * @returns {Promise<any>}
 */
export async function importTs(relativePath) {
  if (!hooked) {
    registerHooks({
      resolve(specifier, context, nextResolve) {
        if (/^\.\.?\//.test(specifier) && !path.extname(specifier) && context.parentURL?.endsWith('.ts')) {
          return nextResolve(`${specifier}.ts`, context);
        }
        return nextResolve(specifier, context);
      },
    });
    hooked = true;
  }
  return import(pathToFileURL(path.join(root, relativePath)).href);
}

// ── Токены и градиенты ───────────────────────────────────────────────────────

/**
 * Значения токенов из src/styles/tokens.css (единственный источник цветов).
 * @param {string[]} names имена без «--»
 * @returns {Record<string, string>}
 */
export function readTokens(names) {
  const css = readFileSync(path.join(root, 'src/styles/tokens.css'), 'utf8');
  /** @type {Record<string, string>} */
  const tokens = {};
  for (const name of names) {
    const match = css.match(new RegExp(`--${name}\\s*:\\s*([^;]+);`));
    if (!match) throw new Error(`src/styles/tokens.css: нет токена --${name}`);
    tokens[name] = match[1].trim();
  }
  return tokens;
}

/**
 * «:root{--bg:…;…}» для HTML-шаблона — только нужные токены, чтобы отпечаток не менялся от правки остальных.
 * @param {string[]} names
 */
export function tokensCss(names) {
  const tokens = readTokens(names);
  return `:root{${names.map((name) => `--${name}:${tokens[name]}`).join(';')}}`;
}

/**
 * Градиенты-заглушки g1…g7, g3b, g3c — из стилей кадра сайта (src/components/home/Frame.astro), не копией.
 * @returns {Record<string, string>} имя → значение background
 */
export function readGradients() {
  const source = readFileSync(path.join(root, 'src/components/home/Frame.astro'), 'utf8');
  /** @type {Record<string, string>} */
  const gradients = {};
  for (const match of source.matchAll(/\.(g\d[a-z]?)\s*\{\s*background:\s*([^;]+);\s*\}/g)) {
    gradients[match[1]] = match[2].trim();
  }
  if (!Object.keys(gradients).length) throw new Error('src/components/home/Frame.astro: не нашёл градиенты .g1…');
  return gradients;
}

// ── Шрифты ───────────────────────────────────────────────────────────────────

/**
 * @font-face шрифта @fontsource (все наборы знаков, как на сайте) с файлами woff2 внутри HTML (data:).
 * Внешних запросов и путей к файлам нет — шаблон одинаков на любом компьютере.
 * @param {'inter' | 'space-grotesk'} pkg
 * @param {number} weight
 */
export function fontFaces(pkg, weight) {
  const dir = path.join(root, 'node_modules', '@fontsource', pkg);
  const css = readFileSync(path.join(dir, `${weight}.css`), 'utf8');
  const inlined = css.replace(
    /url\(\.\/files\/([^)]+?\.woff2)\)\s*format\('woff2'\)(?:\s*,\s*url\(\.\/files\/[^)]+?\.woff\)\s*format\('woff'\))?/g,
    (_, file) => `url(data:font/woff2;base64,${readFileSync(path.join(dir, 'files', file)).toString('base64')}) format('woff2')`,
  );
  if (inlined.includes('./files/')) {
    throw new Error(`@fontsource/${pkg}/${weight}.css: незнакомый формат @font-face — поправь fontFaces() в scripts/images.mjs`);
  }
  return inlined;
}

// ── PNG ──────────────────────────────────────────────────────────────────────

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Куски PNG по порядку.
 * @param {Buffer} buffer
 */
function pngChunks(buffer) {
  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(pngSignature)) throw new Error('это не PNG');
  /** @type {{ type: string, data: Buffer, raw: Buffer }[]} */
  const chunks = [];
  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const end = offset + 12 + length;
    if (end > buffer.length) throw new Error('PNG обрезан');
    const type = buffer.toString('latin1', offset + 4, offset + 8);
    chunks.push({ type, data: buffer.subarray(offset + 8, offset + 8 + length), raw: buffer.subarray(offset, end) });
    offset = end;
    if (type === 'IEND') break;
  }
  if (chunks[0]?.type !== 'IHDR') throw new Error('PNG без заголовка IHDR');
  return chunks;
}

/**
 * Размер и текстовые записи PNG.
 * @param {Buffer} buffer
 * @returns {{ width: number, height: number, text: Record<string, string> }}
 */
export function readPng(buffer) {
  const chunks = pngChunks(buffer);
  /** @type {Record<string, string>} */
  const text = {};
  for (const { type, data } of chunks) {
    if (type !== 'tEXt') continue;
    const zero = data.indexOf(0);
    if (zero > 0) text[data.toString('latin1', 0, zero)] = data.toString('latin1', zero + 1);
  }
  const ihdr = chunks[0].data;
  return { width: ihdr.readUInt32BE(0), height: ihdr.readUInt32BE(4), text };
}

/**
 * PNG с текстовой записью key=value сразу после IHDR (старая запись с тем же ключом убирается).
 * @param {Buffer} buffer
 * @param {string} key
 * @param {string} value
 */
export function withPngText(buffer, key, value) {
  const chunks = pngChunks(buffer).filter(
    ({ type, data }) => !(type === 'tEXt' && data.toString('latin1', 0, data.indexOf(0)) === key),
  );
  const data = Buffer.from(`${key}\0${value}`, 'latin1');
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write('tEXt', 4, 'latin1');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  const text = Buffer.concat([head, data, crc]);
  return Buffer.concat([pngSignature, chunks[0].raw, text, ...chunks.slice(1).map((chunk) => chunk.raw)]);
}

// ── ICO ──────────────────────────────────────────────────────────────────────

/**
 * favicon.ico из готовых PNG (формат ICO с PNG внутри — все браузеры и Windows Vista+).
 * @param {{ size: number, png: Buffer }[]} images
 */
export function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // 1 — иконка
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4); // плоскости
    entry.writeUInt16LE(32, 6); // бит на точку
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map((image) => image.png)]);
}

/**
 * Картинки внутри favicon.ico.
 * @param {Buffer} buffer
 * @returns {{ size: number, png: Buffer }[]}
 */
export function readIco(buffer) {
  if (buffer.length < 6 || buffer.readUInt16LE(0) !== 0 || buffer.readUInt16LE(2) !== 1) throw new Error('это не ICO');
  const count = buffer.readUInt16LE(4);
  /** @type {{ size: number, png: Buffer }[]} */
  const images = [];
  for (let i = 0; i < count; i++) {
    const at = 6 + 16 * i;
    if (at + 16 > buffer.length) throw new Error('ICO обрезан');
    const size = buffer.readUInt8(at) || 256;
    const length = buffer.readUInt32LE(at + 8);
    const offset = buffer.readUInt32LE(at + 12);
    if (offset + length > buffer.length) throw new Error('ICO обрезан');
    images.push({ size, png: buffer.subarray(offset, offset + length) });
  }
  return images;
}

// ── Chrome ───────────────────────────────────────────────────────────────────

/** Флаги Chrome для картинок (входят в отпечаток — inputsHash). */
const chromeArgs = ['--force-color-profile=srgb', '--disable-lcd-text'];

/**
 * Установленный Google Chrome через playwright-core (браузеры Playwright не качаются), как в shots.mjs;
 * свой путь — CHROME_PATH. Цвета — в sRGB без профиля экрана, текст — без цветной субпиксельной гладкости.
 */
export async function launchChrome() {
  const { chromium } = await import('playwright-core');
  const executablePath = process.env.CHROME_PATH;
  const args = [...chromeArgs];
  return chromium.launch(executablePath ? { executablePath, args } : { channel: 'chrome', args });
}

/**
 * Открывает HTML и ждёт шрифты. Возвращает «вес семейство» шрифтов, которые нужны, но не загрузились.
 * @param {import('playwright-core').Page} page
 * @param {string} html
 * @param {{ width: number, height: number, fonts: string[] }} options
 *   fonts — CSS-шорткаты, например '700 30px "Space Grotesk"'
 */
export async function loadHtml(page, html, { width, height, fonts }) {
  await page.setViewportSize({ width, height });
  await page.setContent(html, { waitUntil: 'load' });
  return page.evaluate(async (fonts) => {
    await Promise.all(fonts.map((font) => document.fonts.load(font)));
    await document.fonts.ready;
    const loaded = new Set(
      [...document.fonts].filter((face) => face.status === 'loaded').map((face) => `${face.weight} ${face.family.replace(/["']/g, '')}`),
    );
    return fonts
      .map((font) => {
        const [, weight, family] = font.match(/^(\d+)\s+\S+\s+["']?([^"']+)["']?$/) ?? [];
        return `${weight} ${family}`;
      })
      .filter((key) => !loaded.has(key));
  }, fonts);
}
