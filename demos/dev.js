import * as esbuild from 'esbuild'
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { sse } from 'actordom/node';
import { appRouter } from './dist/server.js';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';

const SERVER_ACTOR_PATH = '/_actordom';

//let demos = sirv('.');
let actorHandler = sse(SERVER_ACTOR_PATH, appRouter);

let ctx = await esbuild.context({
  // ... your build options go here ...
  entryPoints: ['src/app.tsx', 'src/worker.tsx'],
  bundle: true,
  format: 'esm',
  outdir: 'dist',
});

// The return value tells us where esbuild's local server is
let { host, port } = await ctx.serve({
  servedir: '.'
});

const fastify = Fastify({
  logger: true
});

fastify.removeAllContentTypeParsers()
fastify.addContentTypeParser('*', function (request, payload, done) {
  done()
})

fastify.get('/dist', (req, reply) => {
  reply.hijack();
  const res = reply.raw;
  const options = {
    hostname: host,
    port: port,
    path: req.url,
    method: req.method,
    headers: req.headers,
  }

  // Forward each incoming request to esbuild
  const proxyReq = http.request(options, proxyRes => {
    // If esbuild returns "not found", send a custom 404 page
    if (proxyRes.statusCode === 404) {
      res.writeHead(404, { 'Content-Type': 'text/html' })
      res.end('<h1>A custom 404 page</h1>')
      return
    }

    // Otherwise, forward the response from esbuild to the client
    res.writeHead(proxyRes.statusCode, proxyRes.headers)
    proxyRes.pipe(res, { end: true })
  })

  req.pipe(proxyReq, { end: true });
});

fastify.post(SERVER_ACTOR_PATH, (req, reply) => {
  reply.hijack();
  actorHandler(req.raw, reply.raw);
  return reply;
});

fastify.get(SERVER_ACTOR_PATH + '/*', (req, reply) => {
  reply.hijack();
  actorHandler(req.raw, reply.raw);
  return reply;
});

fastify.register(fastifyStatic, {
  root: fileURLToPath(new URL('./', import.meta.url)),
});

fastify.listen({ port: 8002 }, (err, address) => {
  if (err) throw err
  // Server is now listening on ${address}
});