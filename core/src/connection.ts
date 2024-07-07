import type { ActorType, ProcessWithMessage } from './actor.js';
import type { Process, UUID } from './pid.js';
import { router, type AnyRouter } from './remote.js';
import { addSystem, addSystemAlias, sendM, spawn } from './system.js';

type Postable = {
  postMessage(message: any, options?: { transfer?: Transferable[] }): void;
};

type Connection<R extends AnyRouter> = {
  [k in keyof R['routes']]: R['routes'][k]
};

type ServerConnection<R extends AnyRouter> = Omit<Connection<R>, 'supervisor'> & {
  supervisor: Process<ServerSupervisor>;
};

class RemoteActor<A extends ActorType = ActorType> {
  _actor: A = 0 as any;
  constructor(public system: UUID, public name: string) {}
}

type StatusMessage = ['server-status', boolean];

type supervisorMailbox = StatusMessage |
  ['subscribe', ProcessWithMessage<StatusMessage>] |
  ['unsubscribe', ProcessWithMessage<StatusMessage>];
class ServerSupervisor {
  subs = new Set<ProcessWithMessage<StatusMessage>>();
  receive([name, data]: supervisorMailbox) {
    switch(name) {
      case 'subscribe': {
        this.subs.add(data);
        break;
      }
      case 'unsubscribe': {
        this.subs.delete(data);
        break;
      }
      case 'server-status': {
        for(let sub of this.subs) {
          sendM(sub, ['server-status', data]);
        }
      }
    }
  }
}

class ServerTarget implements Postable {
  opened = false;
  queued: any[] = [];
  supervisor = spawn(ServerSupervisor);
  constructor(public path: string){
    const events = new EventSource(path + '/events');
    events.onopen = () => {
      this.opened = true;
      if(this.queued) {
        this.post(this.queued);
      }
      sendM(this.supervisor, ['server-status', true]);
    };
    events.onmessage = (event) => {
      const message = JSON.parse(event.data);
      switch(message.type) {
        case 'send': {
          sendM(message.pid, message.message);
          break;
        }
        case 'alias': {
          addSystemAlias(message.system, message.alias);
          break;
        }
      }
    };
    events.onerror = () => {
      if(this.opened) {
        this.opened = false;
        sendM(this.supervisor, ['server-status', false]);
      }
    };
  }
  post(message: any) {
    fetch(this.path, {
      method: 'POST',
      body: JSON.stringify(message)
    });
  }
  listenToPort(port: MessagePort) {
    port.onmessage = ev => {
      if(ev.data.type === 'new-system') {
        // listen to this port (messages coming from a worker)
        // and forward back to the server
        this.listenToPort(ev.ports[0]);
      }
      if(!this.opened) {
        this.queued.push(ev.data);
        return;
      }
      this.post(ev.data);
    };
    port.start();
  }
  postMessage(message: any, options: { transfer: Transferable[] }) {
    this.listenToPort(options.transfer[0] as MessagePort);
    if(!this.opened) {
      this.queued.push(message);
      return;
    }
    this.post(message);
  }
}

function createWorkerConnection<R extends AnyRouter>(worker: Postable): Connection<R> {
  let id = addSystem(worker);
  return new Proxy({}, {
    get(target: any, key: string) {
      if(key in target) {
        return target[key];
      }
      return new RemoteActor<any>(id, key);
    }
  }) as any;
}

function createServerConnection<R extends AnyRouter>(url: string | URL): ServerConnection<R> {
  let target = new ServerTarget(url.toString());
  let conn = createWorkerConnection(target) as ServerConnection<R>;
  conn.supervisor = target.supervisor;
  return conn;
}

const island = <R extends AnyRouter>() => <
  K extends keyof R['routes'],
  A extends R['routes'][K],
  AA extends A extends () => Promise<ActorType> ? Awaited<ReturnType<A>> : A
>(name: K, ...args: ConstructorParameters<AA>) => {
  return {
    'data-actor': name,
    'data-args': JSON.stringify(args)
  };
};

export {
  type Connection,
  type Postable,

  createServerConnection,
  createWorkerConnection,
  island,
  RemoteActor
}
