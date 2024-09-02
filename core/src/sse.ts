import cookie from 'cookie';
import { AsyncLocalStorage } from 'node:async_hooks';
import { type UUID, getSystem } from './pid.js';
import type { AnyRouter } from './remote.js';
import { AsyncTracker, createBrowserConnection, type OverTheWireConnectionMessage } from './server.js';

const COOKIE_NAME = '_actordomclient';
const als = new AsyncLocalStorage

type GenericHTTP = {
  pathname: string;
  getCookies(): string | null;
  setHeader(key: string, value: string): void;
  setStatus(status: number): void;
  write(data: string): void;
  onRequestData(cb: (chunk: Uint8Array) => void): void;
  onRequestEnd(cb: () => unknown): void;
  endRequest(): void;
};

type BrowserConnection = ReturnType<typeof createBrowserConnection>;

type Client = {
  id: UUID;
  system: UUID;
  h: GenericHTTP;
  conn: BrowserConnection
};

type RequestStore = {
  id: UUID;
  tracker: AsyncTracker;
  h: GenericHTTP;
};

function getClientId(h: GenericHTTP): UUID | null {
  let rawCookie = h.getCookies();
  if(!rawCookie) {
    return null;
  }
  let cookies = cookie.parse(rawCookie);
  let clientId = cookies[COOKIE_NAME] as UUID | undefined;
  return clientId ?? null;
}

function decorate(h: GenericHTTP): UUID {
  let clientId = getClientId(h);
  if(clientId) return clientId;
  clientId = crypto.randomUUID();
  let prefix = '/';
  h.setHeader('Set-Cookie', `${COOKIE_NAME}=${clientId}; Path=${prefix}; HttpOnly`);
  return clientId;
}

function serverSentEvents(prefix: string, router: AnyRouter) {
  let clients = new Map<UUID, Client>();
  let incoming = new Map<UUID, Omit<Client, 'system'>>();
  let decoder = new TextDecoder();
  let eventsPrefix = prefix + 
        (prefix.endsWith('/') ? '' : '/') +
        'events';  
  function handleEventStream(h: GenericHTTP) {
    let clientId = decorate(h);
    h.setHeader('Content-Type', 'text/event-stream');
    h.setHeader('Connection', 'keep-alive');
    h.setHeader('Cache-Control', 'no-cache');
    h.setStatus(200);
  
    const data = `data: ${JSON.stringify({})}\n\n`;
    h.write(data);
  
    const conn = createBrowserConnection(router, onClientMessage, onServerMessage);
    const newClient = {
      id: clientId,
      h,
      conn,
    };
  
    incoming.set(clientId, newClient);

    h.onRequestEnd(() => {
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
  
  function handleDomActorPost(h: GenericHTTP) {
    let clientId = getClientId(h);
    if(!clientId) {
      h.setStatus(401);
      h.endRequest();
      return;
    }
    let tracker = new AsyncTracker(() => {
      h.endRequest();
      inflight.delete(requestId);
    });
    let requestId = crypto.randomUUID();
    let store: RequestStore = {
      id: requestId,
      tracker,
      h
    };
    inflight.set(requestId, store);
    let body = '';
    h.onRequestData(chunk => {
      body+= decoder.decode(chunk);
    });
    h.onRequestEnd(() => {
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
      tracker.entered();
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
    client.h.write(`data: ${JSON.stringify(message)}\n\n`);
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

  return function(h: GenericHTTP) {
    if(h.pathname.startsWith(prefix)) {
      if(h.pathname.startsWith(eventsPrefix)) {
        handleEventStream(h);
      } else {
        handleDomActorPost(h);
      }
      return;
    }
  };
}

export {
  type GenericHTTP,
  serverSentEvents as sse
}
