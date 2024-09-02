import { defineConfig } from 'astro/config';
import actordom from 'actordom-astro';

export default defineConfig({
  srcDir: 'demo',
  integrations: [actordom()],
  devToolbar: {
    enabled: false,
  },
});
