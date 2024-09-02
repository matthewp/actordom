import type { AstroIntegration } from 'astro';
import vitePlugin from './vite.js';

export default function(): AstroIntegration {
  return {
    name: 'actordom-astro',
    hooks: {
      'astro:config:setup':({ addRenderer, injectRoute, updateConfig }) => {
        addRenderer({
          name: 'actordom-astro',
          clientEntrypoint: 'actordom-astro/client',
          serverEntrypoint: 'actordom-astro/server',          
        });
        
        injectRoute({
          pattern: '/_actordom',
          entrypoint: 'actordom-astro/route'
        });

        updateConfig({
          vite: {
            plugins: [vitePlugin()],
            optimizeDeps: {
						  include: [
                'actordom-astro/client',
                'actordom',
              ],
						  exclude: ['actordom-astro/server'],              
            }
          }
        });
      }
    }
  };
}
