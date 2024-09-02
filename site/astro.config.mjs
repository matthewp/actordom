import { defineConfig } from 'astro/config';
import actordom from 'actordom-astro';

// https://astro.build/config
export default defineConfig({
  integrations: [actordom()],
  devToolbar: {
    enabled: false
  }
});
