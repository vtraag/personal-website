// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.traag.net',
  base: '/',
  // Astro 7 defaults to JSX whitespace rules ('jsx'), which drop spaces at line
  // breaks after inline elements such as links. Use lossless compression instead.
  compressHTML: true,
});
