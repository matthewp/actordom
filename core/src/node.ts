import type {
  Actor,
  ActorType,
  ViewActor,
  MessageName,
} from './actor.js';
import { getSystem, type Process } from './pid.js';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { UUID } from './pid.js';
import { type AnyRouter } from './remote.js';
import cookie from 'cookie';
import { join as pathJoin } from 'node:path';
import { AsyncTracker, createBrowserConnection, renderToString, router, type OverTheWireConnectionMessage } from './server.js';
import { process, send, spawn } from './system.js';
import { update } from './update.js';

const COOKIE_NAME = '_actordomclient';
const als = new AsyncLocalStorage();;

type BrowserConnection = ReturnType<typeof createBrowserConnection>;

type Client = {
  id: UUID;
  system: UUID;
  res: ServerResponse;
  conn: BrowserConnection
};

type RequestStore = {
  id: UUID;
  tracker: AsyncTracker;
  request: IncomingMessage;
  response: ServerResponse;
};

function getClientId(request: IncomingMessage): UUID | null {
  let rawCookie = request.headers.cookie;
  if(!rawCookie) {
    return null;
  }
  let cookies = cookie.parse(rawCookie);
  let clientId = cookies[COOKIE_NAME] as UUID | undefined;
  return clientId ?? null;
}

function decorate(request: IncomingMessage, response: ServerResponse): UUID {
  let clientId = getClientId(request);
  if(clientId) return clientId;
  clientId = crypto.randomUUID();
  let prefix = '/';
  response.setHeader('Set-Cookie', `${COOKIE_NAME}=${clientId}; Path=${prefix}; HttpOnly`);
  return clientId;
}

function serverSentEvents(prefix: string, router: AnyRouter) {
  let clients = new Map<UUID, Client>();
  let incoming = new Map<UUID, Omit<Client, 'system'>>();
  
  function handleEventStream(req: IncomingMessage, res: ServerResponse) {
    let clientId = decorate(req, res);
    const headers = {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
    };
    res.writeHead(200, headers);
  
    const data = `data: ${JSON.stringify({})}\n\n`;
    res.write(data);
  
    const conn = createBrowserConnection(router, onClientMessage, onServerMessage);
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
    let clientId = getClientId(req);
    if(!clientId) {
      res.writeHead(401);
      res.end();
      return;
    }
    let tracker = new AsyncTracker(() => {
      res.end();
      inflight.delete(requestId);
    });
    let requestId = crypto.randomUUID();
    let store: RequestStore = {
      id: requestId,
      tracker,
      request: req,
      response: res
    };
    inflight.set(requestId, store);
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
          }, tracker, requestId);
        })
      } else {
        saveSystem(data, clientId);
        let client = incoming.get(clientId)! as Client;
        client.conn.handle({
          data
        }, tracker, requestId);
      }
    });
  }

  function onClientMessage(message: OverTheWireConnectionMessage) {
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

  const inflight = new Map<UUID, RequestStore>();
  function onServerMessage(id: UUID) {
    let store = inflight.get(id);
    if(store) {
      // Enter the message context with this as the store.
      als.enterWith(store);
    }
    return () => store?.tracker.done();
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

function getAsyncTracker() {
  let store = getRequestStore();
  return store?.tracker;
}

function getRequestStore() {
  return als.getStore() as (RequestStore | undefined);
}

function getServerResponse() {
  let store = getRequestStore();
  return store?.response;
}

function waitFor(p: Promise<any>) {
  let store = getAsyncTracker();
  if(store) {
    store.wait();
    p.finally(() => {
      store.done();
    });
  }
}

export {
  serverSentEvents as sse,

  type Actor,
  type ActorType,
  type ViewActor,
  type MessageName,
  type Process,
  type AnyRouter,

  getServerResponse,
  renderToString,
  router,
  process,
  send,
  spawn,
  update,
  waitFor
}