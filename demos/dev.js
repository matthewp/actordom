// @ts-check
import sirv from 'sirv';
import * as esbuild from 'esbuild'
import http from 'node:http';
import { sse } from './dist2/server.js';

const SERVER_ACTOR_PATH = '/_actordom';

let demos = sirv('.');
let events = sse(SERVER_ACTOR_PATH);

let ctx = await esbuild.context({
  // ... your build options go here ...
  entryPoints: ['src/app.tsx', 'src/worker.tsx'],
  bundle: true,
  format: 'esm',
  outdir: 'dist',
})

// The return value tells us where esbuild's local server is
let { host, port } = await ctx.serve({
  servedir: '.'
});

http.createServer(function(req, res) {
  if(req.url?.startsWith('/dist')) {
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
    return;
  }
  if(req.url?.startsWith(SERVER_ACTOR_PATH)) {
    events(req, res);
    return;
  }
  demos(req, res);
}).listen(8002);
console.error(`Listening at http://localhost:8002`)