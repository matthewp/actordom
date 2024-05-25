import type { ActorType } from './actor.js';
import type { UUID } from './pid.js';
import type { AnyRouter } from './remote.js';
import { addSystem, addSystemAlias, send } from './system.js';

type Postable = {
  postMessage(message: any, transfer?: Transferable[]): void;
};

type Connection<R extends AnyRouter> = {
  //[k in keyof I]: I[k]
  [k in keyof R['_routes']]: R['_routes'][k]
  //expose<N extends keyof R = keyof R>(name: N): RemoteActor<R, N>;
};

class RemoteActor<A extends ActorType = ActorType> {
  _actor: A = 0 as any;
  constructor(public system: UUID, public name: string) {}
}

class ServerTarget implements Postable {
  opened = false;
  queued: any[] = [];
  constructor(public path: string){
    const events = new EventSource(path + '/events');
    events.onopen = () => {
      this.opened = true;
      if(this.queued) {
        this.post(this.queued);
      }
    };
    events.onmessage = (event) => {
      const message = JSON.parse(event.data);
      switch(message.type) {
        case 'send': {
          send(message.pid, message.message);
          break;
        }
        case 'alias': {
          addSystemAlias(message.system, message.alias);
          break;
        }
      }
    };
  }
  post(message: any) {
    fetch(this.path, {
      method: 'POST',
      body: JSON.stringify(message)
    });
  }
  listenToPort(port: MessagePort, id: string) {
    port.onmessage = ev => {
      if(ev.data.type === 'new-system') {
        ev.data.port = crypto.randomUUID();
        // listen to this port (messages coming from a worker)
        // and forward back to the server
        this.listenToPort(ev.ports[0], ev.data.port);
      } else {
        ev.data.port = id;
      }
      if(!this.opened) {
        this.queued.push(ev.data);
        return;
      }
      this.post(ev.data);
    };
    port.start();
  }
  postMessage(message: any, transfer: Transferable[]) {
    let id = crypto.randomUUID();
    this.listenToPort(transfer[0] as MessagePort, id);
    message.port = id;
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
    get(_t, key: string) {
      return new RemoteActor<any>(id, key);
    }
  }) as any;
}

function createServerConnection<R extends AnyRouter>(url: string | URL): Connection<R> {
  let target = new ServerTarget(url.toString());
  return createWorkerConnection(target);
}

export {
  type Postable,

  createServerConnection,
  createWorkerConnection,
  RemoteActor
}