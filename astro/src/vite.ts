import type { Plugin } from 'vite';

export default function(): Plugin {
  return {
    name: "actordom-jsx",
    enforce: "pre",
    config() {
      return {
        esbuild: {
          jsx: "automatic",
          jsxImportSource: "actordom"
        },

        optimizeDeps: {
          include: [
            "actordom/jsx-runtime",
            "actordom/jsx-dev-runtime"
          ]
        }
      }    
    }
  };
}
