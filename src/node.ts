import type {
  Actor,
  ActorType,
  DOMActor,
  MessageName,
} from './actor.js';
import type { Process } from './pid.js';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join as pathJoin } from 'node:path';
import { createHandler, register } from './server.js';
import { process, send, spawn } from './system.js';
import { update } from './update.js';

type Handler = ReturnType<typeof createHandler>;

let clients = new Map<string, any>();

// TODO only send to the right one
function sender(newData: any) {
  clients.forEach(client => client.res.write(`data: ${JSON.stringify(newData)}\n\n`))
}

function handleEventStream(req: IncomingMessage, res: ServerResponse) {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  res.writeHead(200, headers);

  const data = `data: ${JSON.stringify({})}\n\n`;
  res.write(data);

  const clientId = crypto.randomUUID();

  const newClient = {
    id: clientId,
    res
  };

  clients.set(clientId, newClient);

  req.on('close', () => {
    console.log(`${clientId} Connection closed`);
    clients.delete(clientId);
  });
}

function handleDomActorPost(handler: Handler, req: IncomingMessage, res: ServerResponse) {
  let body = '';
  req.setEncoding('utf-8');
  req.on('data', chunk => { body+= chunk });
  req.on('end', () => {
    let data = JSON.parse(body);
    if(Array.isArray(data)) {
      data.forEach(message => {
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

function serverSetEvents(prefix: string) {
  let handler = createHandler(sender);
  return function(req: IncomingMessage, res: ServerResponse) {
    console.log("REQURL", req.url, pathJoin(prefix, 'events'));
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
  serverSetEvents as sse,

  type Actor,
  type ActorType,
  type DOMActor,
  type MessageName,
  type Process,

  register,
  process,
  send,
  spawn,
  update
}