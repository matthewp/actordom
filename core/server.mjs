import Fastify from 'fastify';
import * as esbuild from 'esbuild';
import fastifyStatic from '@fastify/static';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
const fastify = Fastify({logger: true});

let ctx = await esbuild.context({
  // ... your build options go here ...
  entryPoints: [
    'test/browser/test.jsx',
    'test/browser/fixtures/worker1.tsx'
  ],
  bundle: true,
  format: 'esm',
  outdir: 'esbuild',
});

let { host, port } = await ctx.serve({
  servedir: '.',
  port: 8004,
});

fastify.get('/esbuild/*', (req, reply) => {
  let h = reply.hijack();
  const res = reply.raw;
  const options = {
    hostname: host,
    port: port,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  // Forward each incoming request to esbuild
  const proxyReq = http.request(options, proxyRes => {
    // If esbuild returns "not found", send a custom 404 page
    if (proxyRes.statusCode === 404) {
      res.writeHead(404, { 'Content-Type': 'text/html' })
      res.end('<h1>A custom 404 page</h1>')
      return
    }

    // Otherwise, forward the response from esbuild to the client
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  req.raw.pipe(proxyReq, { end: true });
  return h;
});

fastify.register(fastifyStatic, {
  root: fileURLToPath(new URL('./', import.meta.url)),
});

fastify.listen({ port: 8023 }, (err, address) => {
  if (err) throw err;
  // Server is now listening on ${address}
})