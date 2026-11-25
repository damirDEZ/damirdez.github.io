// @ts-check
// Снимки экрана для приёмки: npm run shots
//
// 1. Собирает сайт (astro build). Флаг --no-build — взять готовую папку dist/.
// 2. Поднимает маленький статический сервер над dist/ с учётом подпапки BASE_PATH.
// 3. В установленном Google Chrome (playwright-core, channel "chrome"; свой путь — CHROME_PATH)
//    снимает полностраничные снимки главной 390, 1280, 1920 и снимок 390 с открытым меню в shots/;
//    страницы кейсов (dist/work/<slug>/) проверяет на тех же ширинах, снимает go-fashion на 390/1280/1920,
//    остальные — на 1280 (case-<slug>-<ширина>.png).
// 4. Падает с ошибкой, если: есть горизонтальная прокрутка; страница или её файлы не загрузились;
//    в браузере ошибка JS; меню не открывается/не закрывается; на широком экране видна кнопка меню;
//    якорь ведёт в никуда или после перехода по якорю раздел под шапкой; H1 не один, уровни заголовков
//    перескакивают, у кадра нет alt / aria-label, ссылка в новую вкладку без noopener, ссылка без адреса;
//    ссылка на другую страницу сайта (View case, ← All work, Next work, шапка) не открывается (не 200)
//    или ведёт на несуществующий блок; у кейса заголовок вкладки или description не те;
//    «Next work» не обходит все кейсы по кругу в порядке главной;
//    карточки ссылки или иконки устарели (npm run og / icons -- --check); в <head> страницы нет карточки ссылки,
//    она не 1200×630 или не своя, адреса не полные, иконка не открывается или не того размера.
//
// Подробности — docs/wiki/site.md, карточки и иконки — docs/wiki/seo.md.

import { spawn } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { importTs, readIco, readPng, readTokens } from './images.mjs';
import { getSiteEnv } from './site-env.mjs';

/** @type {typeof import('../src/lib/og.ts')} */
const { faviconIco, ogImagePath, ogImageSize, siteIcons } = await importTs('src/lib/og.ts');

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const distDir = path.join(root, 'dist');
const outDir = path.join(root, 'shots');
const widths = [390, 1280, 1920];
const mobileWidth = 390;
const viewportHeight = 900;
/** Кейс, который снимаем на всех трёх ширинах; остальные кейсы — только на 1280 (проверяются на всех). */
const fullCaseSlug = 'go-fashion';
const caseShotWidth = 1280;
/** Заголовок вкладки кейса: «<H1> — Case study · Damir» (T-004). */
const caseTitleSuffix = ' — Case study · Damir';
const { site, base } = getSiteEnv();
/** Подпапка сайта в адресе: "" или "/repo". */
const prefix = base === '/' ? '' : base;

const mime = /** @type {Record<string, string>} */ ({
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.webmanifest': 'application/manifest+json',
});

/** @param {string} message */
function fail(message) {
  throw new Error(message);
}

/**
 * Запускает скрипт тем же Node, без оболочки — путь с пробелами и скобками не мешает.
 * @param {string[]} args
 * @param {string} name для ошибки
 */
function run(args, name) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: root, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve(undefined) : reject(new Error(`${name} завершился с кодом ${code}`))));
  });
}

function build() {
  return run([path.join(root, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'build'], 'astro build');
}

/** Статический сервер над dist/: сайт отдаётся по адресу <base>/, как на GitHub Pages. */
function serve() {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      res.writeHead(400).end('Bad request');
      return;
    }
    if (prefix && pathname === prefix) {
      res.writeHead(301, { Location: `${prefix}/` }).end();
      return;
    }
    if (prefix && !pathname.startsWith(`${prefix}/`)) {
      res.writeHead(404).end('Not found');
      return;
    }
    const relative = pathname.slice(prefix.length);
    let file = path.join(distDir, relative);
    if (file !== distDir && !file.startsWith(distDir + path.sep)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404).end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file).toLowerCase()] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

/**
 * Открывает страницу, собирает ошибки загрузки и JS.
 * @param {import('playwright-core').Browser} browser
 * @param {number} width
 * @param {string} url
 */
async function openPage(browser, width, url) {
  const context = await browser.newContext({ viewport: { width, height: viewportHeight }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  /** @type {string[]} */
  const problems = [];
  page.on('pageerror', (error) => problems.push(`ошибка JS: ${error.message}`));
  page.on('console', (msg) => {
    // «Failed to load resource» дублирует проверку ответов ниже (там виден адрес) — пропускаем.
    if (msg.type() === 'error' && !msg.text().startsWith('Failed to load resource')) {
      problems.push(`ошибка в консоли: ${msg.text()}`);
    }
  });
  page.on('requestfailed', (request) => problems.push(`не загрузилось: ${request.url()}`));
  page.on('response', (response) => {
    if (response.status() >= 400) problems.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  const response = await page.goto(url, { waitUntil: 'load' });
  if (!response?.ok()) fail(`${width}px: страница не открылась (${response?.status()}) — ${url}`);
  await page.evaluate(() => document.fonts.ready);
  return { context, page, problems };
}

/**
 * Горизонтальная прокрутка: ширина содержимого больше ширины окна.
 * @param {import('playwright-core').Page} page
 * @param {string} label
 */
async function checkNoHorizontalScroll(page, label) {
  const result = await page.evaluate(() => {
    const doc = document.documentElement;
    const clientWidth = doc.clientWidth;
    const scrollWidth = Math.max(doc.scrollWidth, document.body.scrollWidth);
    /** @type {string[]} */
    const offenders = [];
    if (scrollWidth > clientWidth) {
      for (const el of document.querySelectorAll('body *')) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && (rect.right > clientWidth + 0.5 || rect.left < -0.5)) {
          const cls = typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/).join('.')}` : '';
          offenders.push(`${el.tagName.toLowerCase()}${cls} (${Math.round(rect.left)}…${Math.round(rect.right)})`);
          if (offenders.length >= 10) break;
        }
      }
    }
    return { clientWidth, scrollWidth, offenders };
  });
  const ok = result.scrollWidth <= result.clientWidth;
  console.log(`  ${label}: scrollWidth ${result.scrollWidth} ≤ clientWidth ${result.clientWidth} — ${ok ? 'ок' : 'ПРОКРУТКА'}`);
  if (!ok) {
    fail(`${label}: горизонтальная прокрутка. Вылезают: ${result.offenders.join('; ') || 'не найдено'}`);
  }
}

/**
 * Меню на узком экране: открывается, закрывается по Escape и по клику на пункт.
 * @param {import('playwright-core').Page} page
 */
async function checkMenu(page) {
  const button = page.locator('[data-menu-button]');
  const menu = page.locator('[data-menu]');
  const expanded = () => button.getAttribute('aria-expanded');

  if (!(await button.isVisible())) fail('390px: кнопка меню не видна');
  if (await page.locator('header nav.links').isVisible()) fail('390px: список разделов в шапке не спрятан');
  if (await menu.isVisible()) fail('390px: меню открыто до нажатия');

  // Клавиатура: фокус на кнопке, Enter открывает, Escape закрывает и возвращает фокус.
  await button.focus();
  await page.keyboard.press('Enter');
  if ((await expanded()) !== 'true' || !(await menu.isVisible())) fail('390px: меню не открылось по Enter');
  await page.keyboard.press('Escape');
  if ((await expanded()) !== 'false' || (await menu.isVisible())) fail('390px: меню не закрылось по Escape');
  if (!(await button.evaluate((el) => el === document.activeElement))) {
    fail('390px: после Escape фокус не вернулся на кнопку меню');
  }

  // Клавиатура: Tab с кнопки ведёт в пункты меню; фокус ушёл из меню — меню закрылось.
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  if (!(await menu.locator('a').first().evaluate((el) => el === document.activeElement))) {
    fail('390px: Tab с кнопки меню не ведёт в первый пункт');
  }
  await page.locator('header .logo').focus();
  if ((await expanded()) !== 'false' || (await menu.isVisible())) fail('390px: меню не закрылось, когда фокус ушёл из него');

  // Мышь: клик по пункту закрывает меню.
  await button.click();
  if ((await expanded()) !== 'true' || !(await menu.isVisible())) fail('390px: меню не открылось по клику');
  await menu.locator('a').first().click();
  if ((await expanded()) !== 'false' || (await menu.isVisible())) fail('390px: меню не закрылось по клику на пункт');

  // Открываем снова — для снимка.
  await button.click();
  if (!(await menu.isVisible())) fail('390px: меню не открылось повторно');
  await page.evaluate(() => window.scrollTo(0, 0));
  console.log('  меню: открывается (клик, Enter), закрывается (Escape, уход фокуса, пункт) — ок');
}

/**
 * Якоря. Все ссылки-якоря на эту же страницу (и в шапке, и в меню) ведут на существующие видимые блоки.
 * Для каждого раздела из шапки: после перехода по якорю блок и его заголовок не под липкой шапкой
 * (scroll-padding-top) и заголовок виден в окне.
 * На странице кейса шапка ведёт на разделы главной (другая страница — их проверяет checkOtherPages),
 * поэтому там headerAnchors: false — проверяются только якоря на саму страницу, если они есть.
 * @param {import('playwright-core').Page} page
 * @param {number} width
 * @param {{ headerAnchors?: boolean, label?: string }} [options]
 */
async function checkAnchors(page, width, { headerAnchors = true, label = `${width}px` } = {}) {
  const { navIds, broken } = await page.evaluate(() => {
    /** @type {string[]} */
    const navIds = [];
    /** @type {string[]} */
    const broken = [];
    for (const a of document.querySelectorAll('a[href*="#"]')) {
      const url = new URL(/** @type {HTMLAnchorElement} */ (a).href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || url.hash.length < 2) continue;
      const id = decodeURIComponent(url.hash.slice(1));
      const target = document.getElementById(id);
      if (!target || target.getClientRects().length === 0) {
        broken.push(`«${a.textContent?.trim()}» → #${id}`);
      } else if (a.closest('header') && !navIds.includes(id)) {
        navIds.push(id);
      }
    }
    return { navIds, broken };
  });
  if (broken.length) fail(`${label}: якоря ведут в никуда: ${broken.join('; ')}`);
  if (!headerAnchors) return;
  if (!navIds.length) fail(`${width}px: в шапке нет ссылок на разделы`);

  for (const id of navIds) {
    const pos = await page.evaluate(async (id) => {
      history.replaceState(null, '', location.pathname + location.search);
      window.scrollTo(0, 0);
      location.hash = id;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const header = document.querySelector('[data-site-header]');
      const target = document.getElementById(id);
      const heading = target?.querySelector('h1, h2, h3');
      return {
        headerBottom: header ? header.getBoundingClientRect().bottom : 0,
        targetTop: target ? target.getBoundingClientRect().top : NaN,
        headingTop: heading ? heading.getBoundingClientRect().top : NaN,
        headingBottom: heading ? heading.getBoundingClientRect().bottom : NaN,
        viewport: window.innerHeight,
      };
    }, id);
    // 2px запаса: отступ под шапку — 72/64px, а у шапки ещё линия снизу 1px; браузер прокручивает
    // на целые пиксели, поэтому верх блока бывает на долю пикселя выше. Без отступа блок ушёл бы под шапку целиком.
    if (!(pos.targetTop >= pos.headerBottom - 2)) {
      fail(`${width}px: #${id} после перехода под шапкой (верх блока ${pos.targetTop.toFixed(1)}, низ шапки ${pos.headerBottom.toFixed(1)})`);
    }
    if (!(pos.headingTop >= pos.headerBottom) || !(pos.headingBottom <= pos.viewport)) {
      fail(`${width}px: заголовок #${id} после перехода не виден целиком (верх ${pos.headingTop.toFixed(1)}, низ шапки ${pos.headerBottom.toFixed(1)}, окно ${pos.viewport})`);
    }
  }
  await page.evaluate(() => {
    history.replaceState(null, '', location.pathname + location.search);
    window.scrollTo(0, 0);
  });
  console.log(`  якоря ${width}px: ${navIds.map((id) => `#${id}`).join(', ')} — на месте, заголовки не под шапкой — ок`);
}

/**
 * Доступность главного: один H1, уровни заголовков не перескакивают, у кадров есть alt / aria-label,
 * ссылки в новую вкладку — с rel="noopener", ссылок в никуда нет.
 * @param {import('playwright-core').Page} page
 * @param {number} width
 * @param {string} [label] подпись в ошибке (по умолчанию «<ширина>px»)
 */
async function checkA11y(page, width, label = `${width}px`) {
  const problems = await page.evaluate(() => {
    /** @type {string[]} */
    const problems = [];
    const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')];
    const h1Count = headings.filter((h) => h.tagName === 'H1').length;
    if (h1Count !== 1) problems.push(`H1 на странице: ${h1Count}, нужен один`);
    let prev = 0;
    for (const h of headings) {
      const level = Number(h.tagName[1]);
      if (prev && level > prev + 1) problems.push(`после H${prev} сразу H${level}: «${h.textContent?.trim()}»`);
      prev = level;
    }
    for (const img of document.querySelectorAll('img:not([alt])')) {
      problems.push(`картинка без alt: ${img.getAttribute('src')}`);
    }
    for (const el of document.querySelectorAll('[role="img"]')) {
      if (!el.getAttribute('aria-label')?.trim()) problems.push(`кадр без aria-label: ${el.outerHTML.slice(0, 80)}`);
    }
    for (const a of document.querySelectorAll('a')) {
      const href = a.getAttribute('href');
      if (!href || href === '#') problems.push(`ссылка в никуда: «${a.textContent?.trim()}»`);
      if (a.target === '_blank' && !a.relList.contains('noopener')) {
        problems.push(`новая вкладка без rel="noopener": ${href}`);
      }
    }
    return problems;
  });
  if (problems.length) fail(`${label}: доступность — ${problems.join('; ')}`);
}

/**
 * Широкий экран: разделы видны, кнопки меню нет.
 * @param {import('playwright-core').Page} page
 * @param {number} width
 */
async function checkDesktopNav(page, width) {
  if (!(await page.locator('header nav.links').isVisible())) fail(`${width}px: разделы в шапке не видны`);
  if (await page.locator('[data-menu-button]').isVisible()) fail(`${width}px: видна кнопка меню`);
}

/**
 * Меню на узкой странице кейса: открывается кликом (без горизонтальной прокрутки), закрывается по Escape.
 * Полная проверка меню — на главной (checkMenu); здесь пункт не нажимаем — он увёл бы на главную.
 * @param {import('playwright-core').Page} page
 * @param {string} label
 */
async function checkMenuOpens(page, label) {
  const button = page.locator('[data-menu-button]');
  const menu = page.locator('[data-menu]');
  if (!(await button.isVisible())) fail(`${label}: кнопка меню не видна`);
  if (await page.locator('header nav.links').isVisible()) fail(`${label}: список разделов в шапке не спрятан`);
  await button.click();
  if ((await button.getAttribute('aria-expanded')) !== 'true' || !(await menu.isVisible())) {
    fail(`${label}: меню не открылось по клику`);
  }
  await checkNoHorizontalScroll(page, `${label} с меню`);
  await page.keyboard.press('Escape');
  if ((await button.getAttribute('aria-expanded')) !== 'false' || (await menu.isVisible())) {
    fail(`${label}: меню не закрылось по Escape`);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

/**
 * "/repo/work/go-fashion/" → "go-fashion"; другой адрес → undefined.
 * @param {string} pathname
 */
function caseSlugFromPathname(pathname) {
  if (prefix && !pathname.startsWith(`${prefix}/`)) return undefined;
  return pathname.slice(prefix.length).match(/^\/work\/([^/]+)\/?$/)?.[1];
}

/** Кейсы в сборке: папки dist/work/<slug>/ с index.html. */
function listCaseSlugs() {
  const dir = path.join(distDir, 'work');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(path.join(dir, entry.name, 'index.html')))
    .map((entry) => entry.name)
    .sort();
}

/**
 * Ссылки на другие страницы сайта (View case, ← All work, Next work, шапка): страница отвечает 200,
 * а якорь (/#work) есть на ней и виден. Возвращает кейсы, на которые ведут ссылки, в порядке страницы.
 * @param {import('playwright-core').BrowserContext} context
 * @param {import('playwright-core').Page} page
 * @param {string} label
 */
async function checkOtherPages(context, page, label) {
  const links = await page.evaluate(() =>
    [...document.querySelectorAll('a[href]')].map((a) => ({
      href: /** @type {HTMLAnchorElement} */ (a).href,
      text: (a.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 50),
    })),
  );
  const here = new URL(page.url());
  /** @type {Map<string, { hashes: Set<string>, texts: Set<string> }>} */
  const pages = new Map();
  /** @type {string[]} */
  const caseOrder = [];
  for (const { href, text } of links) {
    const url = new URL(href);
    if (url.origin !== here.origin || url.pathname === here.pathname) continue;
    const entry = pages.get(url.pathname) ?? { hashes: new Set(), texts: new Set() };
    if (url.hash.length > 1) entry.hashes.add(decodeURIComponent(url.hash.slice(1)));
    entry.texts.add(text);
    pages.set(url.pathname, entry);
    const slug = caseSlugFromPathname(url.pathname);
    if (slug && !caseOrder.includes(slug)) caseOrder.push(slug);
  }
  /** @type {string[]} */
  const summary = [];
  for (const [pathname, { hashes, texts }] of pages) {
    const target = `${here.origin}${pathname}`;
    const what = `«${[...texts].join('», «')}» → ${pathname}`;
    const response = await context.request.get(target);
    if (response.status() !== 200) fail(`${label}: ссылка ведёт на страницу с ответом ${response.status()}: ${what}`);
    summary.push(hashes.size ? `${pathname} (#${[...hashes].join(', #')})` : pathname);
    if (!hashes.size) continue;
    const other = await context.newPage();
    try {
      await other.goto(target, { waitUntil: 'load' });
      const missing = await other.evaluate(
        (ids) => ids.filter((id) => (document.getElementById(id)?.getClientRects().length ?? 0) === 0),
        [...hashes],
      );
      if (missing.length) {
        fail(`${label}: на ${pathname} нет видимых блоков: ${missing.map((id) => `#${id}`).join(', ')} (${what})`);
      }
    } finally {
      await other.close();
    }
  }
  console.log(`  ${label}: ссылки на другие страницы — 200, блоки на месте: ${summary.join('; ') || 'нет'} — ок`);
  return caseOrder;
}

/**
 * Head кейса: заголовок вкладки «<H1> — Case study · Damir», description — лид (строка под H1).
 * @param {import('playwright-core').Page} page
 * @param {string} label
 */
async function checkCaseHead(page, label) {
  const head = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return {
      title: document.title,
      h1: h1?.textContent?.trim() ?? '',
      lead: h1?.nextElementSibling?.textContent?.trim() ?? '',
      description: document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ?? '',
    };
  });
  if (!head.h1 || head.title !== `${head.h1}${caseTitleSuffix}`) {
    fail(`${label}: заголовок вкладки «${head.title}», ожидался «${head.h1}${caseTitleSuffix}»`);
  }
  if (!head.description || head.description !== head.lead) {
    fail(`${label}: description «${head.description}» не совпадает с лидом «${head.lead}»`);
  }
}

/**
 * Карточка ссылки и иконки в <head> (T-008, docs/wiki/seo.md):
 * - og:*, twitter:card, theme-color, canonical — по одному; og:title / og:description = title / description;
 * - og:url = canonical = полный адрес этой страницы (с подпапкой; если задан SITE_URL — с его началом);
 * - og:image — полный адрес своей карточки (главная — og/home.png, кейс — og/<slug>.png): файл открывается,
 *   он 1200×630 и так же записан в og:image:width / og:image:height;
 * - каждая иконка из src/lib/og.ts подключена один раз, открывается и нужного размера; favicon.ico открывается.
 * @param {import('playwright-core').BrowserContext} context
 * @param {import('playwright-core').Page} page
 * @param {string} label
 * @param {{ slug?: string, type: 'website' | 'article' }} expected
 */
async function checkHeadMeta(context, page, label, { slug, type }) {
  const head = await page.evaluate(() => {
    /** @param {string} selector */
    const all = (selector) => [...document.head.querySelectorAll(selector)];
    /** @type {Record<string, string[]>} */
    const meta = {};
    for (const el of all('meta[property], meta[name]')) {
      const key = el.getAttribute('property') ?? el.getAttribute('name') ?? '';
      (meta[key] ??= []).push(el.getAttribute('content') ?? '');
    }
    return {
      title: document.title,
      meta,
      canonical: all('link[rel="canonical"]').map((el) => el.getAttribute('href') ?? ''),
      icons: all('link[rel="icon"], link[rel="apple-touch-icon"]').map((el) => ({
        rel: el.getAttribute('rel') ?? '',
        sizes: el.getAttribute('sizes') ?? '',
        href: /** @type {HTMLLinkElement} */ (el).href,
      })),
    };
  });
  /** @type {string[]} */
  const problems = [];
  /** @param {string} key */
  const one = (key) => {
    const values = head.meta[key] ?? [];
    if (values.length !== 1) problems.push(`${key}: тегов ${values.length}, нужен один`);
    return values[0] ?? '';
  };
  /** @param {string} value */
  const absolute = (value) => {
    try {
      const parsed = new URL(value);
      return /^https?:$/.test(parsed.protocol) ? parsed : undefined;
    } catch {
      return undefined;
    }
  };
  const here = new URL(page.url());
  /**
   * Файл с локального сервера по пути из тега: ответ 200 и тело.
   * @param {string} pathname
   */
  const fetchFile = async (pathname) => {
    const response = await context.request.get(`${here.origin}${pathname}`);
    if (response.status() !== 200) {
      problems.push(`${pathname}: ответ ${response.status()}`);
      return undefined;
    }
    return response.body();
  };

  if (one('og:title') !== head.title) problems.push(`og:title «${head.meta['og:title']}» ≠ title «${head.title}»`);
  if (one('og:description') !== one('description')) problems.push('og:description ≠ description');
  if (one('og:type') !== type) problems.push(`og:type «${head.meta['og:type']}», нужен «${type}»`);
  if (!one('og:site_name')) problems.push('og:site_name пустой');
  if (one('twitter:card') !== 'summary_large_image') problems.push('twitter:card — не summary_large_image');
  const bg = readTokens(['bg']).bg;
  if (one('theme-color').toLowerCase() !== bg.toLowerCase()) problems.push(`theme-color «${head.meta['theme-color']}», нужен ${bg} (--bg)`);

  const ogUrl = absolute(one('og:url'));
  if (head.canonical.length !== 1) problems.push(`link rel=canonical: ${head.canonical.length}, нужна одна`);
  if (!ogUrl) {
    problems.push(`og:url «${head.meta['og:url']}» — не полный адрес`);
  } else {
    if (head.canonical[0] !== ogUrl.href) problems.push(`canonical «${head.canonical[0]}» ≠ og:url «${ogUrl.href}»`);
    if (ogUrl.pathname !== here.pathname) problems.push(`og:url ведёт на ${ogUrl.pathname}, а страница — ${here.pathname}`);
    if (site && ogUrl.origin !== new URL(site).origin) problems.push(`og:url «${ogUrl.href}» не на адресе сайта ${site}`);
  }

  const ogImage = absolute(one('og:image'));
  const imagePath = `${prefix}/${ogImagePath(slug)}`;
  if (!ogImage) {
    problems.push(`og:image «${head.meta['og:image']}» — не полный адрес`);
  } else {
    if (ogUrl && ogImage.origin !== ogUrl.origin) problems.push(`og:image «${ogImage.href}» не на том же адресе, что og:url`);
    if (ogImage.pathname !== imagePath) problems.push(`og:image ведёт на ${ogImage.pathname}, нужна своя карточка ${imagePath}`);
    const body = await fetchFile(ogImage.pathname);
    if (body) {
      try {
        const png = readPng(body);
        if (png.width !== ogImageSize.width || png.height !== ogImageSize.height) {
          problems.push(`${ogImage.pathname}: ${png.width}×${png.height}, нужно ${ogImageSize.width}×${ogImageSize.height}`);
        }
      } catch (error) {
        problems.push(`${ogImage.pathname}: ${error instanceof Error ? error.message : error}`);
      }
    }
  }
  if (one('og:image:width') !== String(ogImageSize.width) || one('og:image:height') !== String(ogImageSize.height)) {
    problems.push(`og:image:width/height — ${head.meta['og:image:width']}×${head.meta['og:image:height']}, нужно ${ogImageSize.width}×${ogImageSize.height}`);
  }

  for (const icon of siteIcons) {
    const sizes = `${icon.size}x${icon.size}`;
    const links = head.icons.filter((link) => link.rel === icon.rel && link.sizes === sizes);
    if (links.length !== 1) {
      problems.push(`иконка ${icon.file}: ссылок rel="${icon.rel}" sizes="${sizes}" — ${links.length}, нужна одна`);
      continue;
    }
    const { pathname } = new URL(links[0].href);
    if (pathname !== `${prefix}/${icon.file}`) problems.push(`иконка ${sizes} ведёт на ${pathname}, нужно ${prefix}/${icon.file}`);
    const body = await fetchFile(pathname);
    if (!body) continue;
    try {
      const png = readPng(body);
      if (png.width !== icon.size || png.height !== icon.size) problems.push(`${pathname}: ${png.width}×${png.height}, нужно ${sizes}`);
    } catch (error) {
      problems.push(`${pathname}: ${error instanceof Error ? error.message : error}`);
    }
  }
  if (head.icons.length !== siteIcons.length) {
    problems.push(`ссылок на иконки ${head.icons.length}, в src/lib/og.ts — ${siteIcons.length}`);
  }
  const ico = await fetchFile(`${prefix}/${faviconIco}`);
  if (ico) {
    try {
      readIco(ico);
    } catch (error) {
      problems.push(`${prefix}/${faviconIco}: ${error instanceof Error ? error.message : error}`);
    }
  }

  if (problems.length) fail(`${label}: <head> — ${problems.join('; ')}`);
  console.log(`  ${label}: карточка ссылки ${ogImage?.href} (${ogImageSize.width}×${ogImageSize.height}), og:url ${ogUrl?.href}, иконки — ок`);
}

/**
 * «Next work»: у каждого кейса ссылка на следующий, круг обходит все кейсы и замыкается;
 * кейсы, на которые ссылается главная, идут в круге в порядке главной. Кейс один — карточки нет.
 * @param {string[]} slugs все кейсы в сборке
 * @param {Map<string, string | null>} nextBySlug
 * @param {string[]} homeOrder кейсы в порядке ссылок на главной
 */
function checkNextCycle(slugs, nextBySlug, homeOrder) {
  if (slugs.length === 0) return;
  if (slugs.length === 1) {
    if (nextBySlug.get(slugs[0])) fail(`кейс один (${slugs[0]}), а карточка «Next work» есть`);
    console.log('  Next work: кейс один — карточки нет — ок');
    return;
  }
  const start = homeOrder[0] ?? slugs[0];
  const cycle = [start];
  let current = start;
  for (;;) {
    const next = nextBySlug.get(current);
    if (!next) fail(`у кейса ${current} нет карточки «Next work»`);
    if (!slugs.includes(/** @type {string} */ (next))) fail(`«Next work» у ${current} ведёт на ${next} — такого кейса нет`);
    if (next === start) break;
    if (cycle.includes(/** @type {string} */ (next))) {
      fail(`«Next work» зациклился, не вернувшись к первому: ${[...cycle, next].join(' → ')}`);
    }
    cycle.push(/** @type {string} */ (next));
    current = /** @type {string} */ (next);
  }
  if (cycle.length !== slugs.length) {
    fail(`«Next work» обходит не все кейсы: ${cycle.join(' → ')} (в сборке: ${slugs.join(', ')})`);
  }
  if (homeOrder.some((slug, index) => cycle[index] !== slug)) {
    fail(`«Next work» не в порядке главной: круг ${cycle.join(' → ')}, на главной ${homeOrder.join(', ')}`);
  }
  console.log(`  Next work: ${[...cycle, start].join(' → ')} — по кругу, в порядке главной — ок`);
}

async function main() {
  const noBuild = process.argv.includes('--no-build');
  // Карточки ссылки и иконки лежат в public/ готовыми: устарели относительно данных — дальше не идём.
  await run([path.join(root, 'scripts', 'og.mjs'), '--check'], 'npm run og -- --check');
  await run([path.join(root, 'scripts', 'icons.mjs'), '--check'], 'npm run icons -- --check');
  if (noBuild) {
    if (!existsSync(path.join(distDir, 'index.html'))) fail('Нет dist/index.html — запусти без --no-build');
    console.log('Беру готовую сборку dist/');
  } else {
    console.log('Сборка сайта…');
    await build();
  }

  mkdirSync(outDir, { recursive: true });
  // Снимки кейсов — заново каждый раз: снимок удалённого или переименованного кейса не должен остаться в shots/.
  for (const name of readdirSync(outDir)) {
    if (/^case-.+\.png$/.test(name)) unlinkSync(path.join(outDir, name));
  }
  const server = /** @type {import('node:http').Server} */ (await serve());
  const address = server.address();
  if (!address || typeof address === 'string') fail('Сервер не запустился');
  const url = `http://127.0.0.1:${/** @type {import('node:net').AddressInfo} */ (address).port}${base === '/' ? '/' : `${base}/`}`;
  console.log(`Сайт: ${url}`);

  const executablePath = process.env.CHROME_PATH;
  const browser = await chromium.launch(executablePath ? { executablePath } : { channel: 'chrome' });
  /** @type {string[]} */
  const saved = [];
  const caseSlugs = listCaseSlugs();
  /** Кейсы в порядке ссылок на главной. */
  let homeCaseOrder = /** @type {string[]} */ ([]);
  /** @type {Map<string, string | null>} */
  const nextBySlug = new Map();
  try {
    console.log('Главная:');
    for (const width of widths) {
      const { context, page, problems } = await openPage(browser, width, url);
      const file = path.join(outDir, `home-${width}.png`);
      await checkNoHorizontalScroll(page, `${width}px`);
      await checkA11y(page, width);
      if (width === mobileWidth) {
        await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
        saved.push(file);
        await checkAnchors(page, width);
        await checkMenu(page);
        await checkNoHorizontalScroll(page, `${width}px с меню`);
        const menuFile = path.join(outDir, `home-${width}-menu.png`);
        await page.screenshot({ path: menuFile, animations: 'disabled' });
        saved.push(menuFile);
      } else {
        await checkDesktopNav(page, width);
        await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
        saved.push(file);
        await checkAnchors(page, width);
      }
      // Ссылки на другие страницы (View case, карточки работ) и <head> одинаковы на всех ширинах — проверяем один раз.
      if (width === caseShotWidth) {
        homeCaseOrder = await checkOtherPages(context, page, `главная ${width}px`);
        await checkHeadMeta(context, page, 'главная', { type: 'website' });
      }
      if (problems.length) fail(`${width}px: ${problems.join('; ')}`);
      await context.close();
    }

    for (const slug of caseSlugs) {
      console.log(`Кейс ${slug}:`);
      const caseUrl = `${url}work/${slug}/`;
      for (const width of widths) {
        const label = `${slug} ${width}px`;
        const { context, page, problems } = await openPage(browser, width, caseUrl);
        await checkNoHorizontalScroll(page, label);
        await checkA11y(page, width, label);
        await checkCaseHead(page, label);
        if (width !== mobileWidth) await checkDesktopNav(page, width);
        // Снимок — до проверок, которые двигают фокус и прокрутку.
        if (slug === fullCaseSlug || width === caseShotWidth) {
          const file = path.join(outDir, `case-${slug}-${width}.png`);
          await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
          saved.push(file);
        }
        await checkAnchors(page, width, { headerAnchors: false, label });
        if (width === mobileWidth) await checkMenuOpens(page, label);
        if (width === caseShotWidth) {
          await checkOtherPages(context, page, label);
          await checkHeadMeta(context, page, `кейс ${slug}`, { slug, type: 'article' });
          const nextHrefs = await page
            .locator('[data-next-case]')
            .evaluateAll((els) => els.map((el) => /** @type {HTMLAnchorElement} */ (el).href));
          if (nextHrefs.length > 1) fail(`${label}: карточек «Next work» ${nextHrefs.length}, нужна одна`);
          const next = nextHrefs[0] ? caseSlugFromPathname(new URL(nextHrefs[0]).pathname) : undefined;
          if (nextHrefs[0] && !next) fail(`${label}: «Next work» ведёт не на кейс: ${nextHrefs[0]}`);
          nextBySlug.set(slug, next ?? null);
        }
        if (problems.length) fail(`${label}: ${problems.join('; ')}`);
        await context.close();
      }
    }
    for (const slug of homeCaseOrder) {
      if (!caseSlugs.includes(slug)) fail(`главная ссылается на кейс ${slug}, а страницы нет`);
    }
    checkNextCycle(caseSlugs, nextBySlug, homeCaseOrder);
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`Готово, снимков: ${saved.length}`);
  for (const file of saved) console.log(`  ${path.relative(root, file)}`);
}

main().catch((error) => {
  console.error(`\nnpm run shots: ОШИБКА — ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
