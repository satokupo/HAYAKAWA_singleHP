// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
  // SSG（静的生成）を明示
  output: 'static',
  integrations: [tailwind(), preact()],
});
