// @ts-check
import { defineConfig } from 'astro/config';
import { getSiteEnv } from './scripts/site-env.mjs';

// site и base приходят из окружения (SITE_URL, BASE_PATH), чтобы один и тот же код
// выкладывался и на <ник>.github.io, и на <ник>.github.io/<репо>. Подробности — docs/wiki/site.md.
const { site, base } = getSiteEnv();

export default defineConfig({
  site,
  base,
  vite: {
    build: {
      // Astro собирает CSS под «esnext»: пропадает -webkit-backdrop-filter (Safari до 18),
      // медиазапросы переписываются в новый синтаксис. Цель — «широко доступная база»,
      // которую Vite берёт по умолчанию (ESBUILD_BASELINE_WIDELY_AVAILABLE_TARGET).
      cssTarget: ['chrome111', 'edge111', 'firefox114', 'safari16.4', 'ios16.4'],
    },
  },
});
