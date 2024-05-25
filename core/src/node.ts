import type {
  Actor,
  ActorType,
  DOMActor,
  MessageName,
} from './actor.js';
import type { Process } from './pid.js';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join as pathJoin } from 'node:path';
import { type AnyRouter } from './remote.js';
import { createHandler, router, type OverTheWireConnectionMessage } from './server.js';
import { process, send, spawn } from './system.js';
import { update } from './update.js';

type Handler = ReturnType<typeof createHandler>;

function serverSentEvents(prefix: string, router: AnyRouter) {
  let clients = new Map<string, any>();

  // TODO only send to the right one
  function sender(newData: any) {
    clients.forEach(client => client.res.write(`data: ${JSON.stringify(newData)}\n\n`))
  }
  
  function handleEventStream(req: IncomingMessage, res: ServerResponse) {
    const clientId = crypto.randomUUID();
    const headers = {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
      'Set-Cookie': `_actordomclient=${clientId}; Path=${prefix}; HttpOnly`
    };
    res.writeHead(200, headers);
  
    const data = `data: ${JSON.stringify({})}\n\n`;
    res.write(data);
  
    const newClient = {
      id: clientId,
      res
    };
  
    clients.set(clientId, newClient);
  
    req.on('close', () => {
      console.log(`${clientId} Connection closed`);
      clients.delete(clientId);
      // TODO teardown stuff
    });
  }
  
  function handleDomActorPost(handler: Handler, req: IncomingMessage, res: ServerResponse) {
    let body = '';
    req.setEncoding('utf-8');
    req.on('data', chunk => { body+= chunk });
    req.on('end', () => {
      let data = JSON.parse(body) as OverTheWireConnectionMessage | OverTheWireConnectionMessage[];
      if(Array.isArray(data)) {
        data.forEach(message => {
          if(message.type === 'system') {
            message.sender
          }
          handler({
            data: message
          });
        })
      } else {
        handler({
          data
        });
      }
      res.end();
    });
  }

  let handler = createHandler(sender, router);
  return function(req: IncomingMessage, res: ServerResponse) {
    if(req.url?.startsWith(prefix)) {
      if(req.url.startsWith(pathJoin(prefix, 'events'))) {
        handleEventStream(req, res);
      } else {
        handleDomActorPost(handler, req, res);
      }
      return;
    }
  };
}

export {
  serverSentEvents as sse,

  type Actor,
  type ActorType,
  type DOMActor,
  type MessageName,
  type Process,

  router,
  process,
  send,
  spawn,
  update
}