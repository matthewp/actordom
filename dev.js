// @ts-check
import sirv from 'sirv';
import * as esbuild from 'esbuild'
import http from 'node:http';
import { handler } from './demos/dist2/server.js';

let demos = sirv('demos', {
  setHeaders(res) {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  }
});

let ctx = await esbuild.context({
  // ... your build options go here ...
  //demos/src/app.tsx demos/src/worker.tsx --bundle --format=esm --outdir=demos/dist --servedir=demos
  entryPoints: ['demos/src/app.tsx', 'demos/src/worker.tsx'],
  bundle: true,
  format: 'esm',
  outdir: 'demos/dist',
})

// The return value tells us where esbuild's local server is
let { host, port } = await ctx.serve({
  servedir: 'demos'
})

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

      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  
      // Otherwise, forward the response from esbuild to the client
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res, { end: true })
    })
  
    req.pipe(proxyReq, { end: true });
    return;
  }
  if(req.url?.startsWith('/_domactor')) {
    let body = '';
    req.setEncoding('utf-8');
    req.on('data', chunk => { body+= chunk });
    req.on('end', () => {
      let message = JSON.parse(body);
      handler({
        data: message
      });
    });
    return;
  }
  demos(req, res);
}).listen(8002);
console.error(`Listening at http://localhost:8002`)