import type {
  Actor,
  ActorType,
  ViewActor,
  MessageName,
} from './actor.js';
import { getSystem, type Process } from './pid.js';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { UUID } from './pid.js';
import { type AnyRouter } from './remote.js';
import cookie from 'cookie';
import { join as pathJoin } from 'node:path';
import { createBrowserConnection, renderToString, router, type OverTheWireConnectionMessage } from './server.js';
import { process, send, spawn } from './system.js';
import { update } from './update.js';

const COOKIE_NAME = '_actordomclient';

type BrowserConnection = ReturnType<typeof createBrowserConnection>;

type Client = {
  id: UUID;
  system: UUID;
  res: ServerResponse;
  conn: BrowserConnection
};

function serverSentEvents(prefix: string, router: AnyRouter) {
  let clients = new Map<UUID, Client>();
  let incoming = new Map<UUID, Omit<Client, 'system'>>();
  
  function handleEventStream(req: IncomingMessage, res: ServerResponse) {
    const clientId = crypto.randomUUID();
    const headers = {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
      'Set-Cookie': `${COOKIE_NAME}=${clientId}; Path=${prefix}; HttpOnly`
    };
    res.writeHead(200, headers);
  
    const data = `data: ${JSON.stringify({})}\n\n`;
    res.write(data);
  
    const conn = createBrowserConnection(router, onMessage);
    const newClient = {
      id: clientId,
      res,
      conn,
    };
  
    incoming.set(clientId, newClient);
  
    req.on('close', () => {
      console.log(`${clientId} Connection closed`);

      incoming.delete(clientId);
      conn.close();
      const system: Client['system'] = (newClient as any).system;
      if(system) {
        clients.delete(system);
        
      }      
    });
  }

  function saveSystem(message: OverTheWireConnectionMessage, clientId: UUID) {
    if(message.type === 'system') {
      let client = incoming.get(clientId)! as Client;
      let system = message.system;
      client.system = system;
      clients.set(system, client);
      // TODO not sure why we need to do this twice, weird
      clients.set(message.sender, client);
    }
  }
  
  function handleDomActorPost(req: IncomingMessage, res: ServerResponse) {
    let rawCookie = req.headers.cookie;
    if(!rawCookie) {
      res.writeHead(401);
      res.end();
      return;
    }
    let cookies = cookie.parse(rawCookie);
    let clientId = cookies[COOKIE_NAME] as UUID | undefined;
    if(!clientId) {
      res.writeHead(401);
      res.end();
      return;
    }
    let body = '';
    req.setEncoding('utf-8');
    req.on('data', chunk => { body+= chunk });
    req.on('end', () => {
      let data = JSON.parse(body) as OverTheWireConnectionMessage | OverTheWireConnectionMessage[];
      if(Array.isArray(data)) {
        data.forEach(message => {
          saveSystem(message, clientId);
          let client = incoming.get(clientId)! as Client;
          client.conn.handle({
            data: message
          });
        })
      } else {
        saveSystem(data, clientId);
        let client = incoming.get(clientId)! as Client;
        client.conn.handle({
          data
        });
      }
      res.end();
    });
  }

  function onMessage(message: OverTheWireConnectionMessage) {
    let client: Client | undefined;
    if('system' in message) {
      client = clients.get(message.system);
    } else if('pid' in message) {
      let system = getSystem(message.pid);
      client = clients.get(system);
    }
    if(!client) {
      console.warn(`Could not find client`);
      return;
    }
    client.res.write(`data: ${JSON.stringify(message)}\n\n`);
  }

  return function(req: IncomingMessage, res: ServerResponse) {
    if(req.url?.startsWith(prefix)) {
      if(req.url.startsWith(pathJoin(prefix, 'events'))) {
        handleEventStream(req, res);
      } else {
        handleDomActorPost(req, res);
      }
      return;
    }
  };
}

export {
  serverSentEvents as sse,

  type Actor,
  type ActorType,
  type ViewActor,
  type MessageName,
  type Process,
  type AnyRouter,

  renderToString,
  router,
  process,
  send,
  spawn,
  update
}