import type {
  Actor,
  ActorType,
  DOMActor,
  MessageName,
} from './actor.js';
import type { Process } from './pid.js';
import { isPIDLike, systemIndex } from './pid.js';
import type { Registry } from './register.js';
import { update, _root } from './update.js';
import { process, addSystem, send } from './system.js';

type Postable = {
  postMessage(message: any, transfer?: Transferable[]): void;
};

class RemoteActor<R extends Registry = Registry, N extends keyof R = keyof R> {
  _actor: R[N] = 0 as any;
  constructor(public system: number, public name: N) {}
}

type Connection<R extends Registry> = {
  system: number;
  expose<N extends keyof R = keyof R>(name: N): RemoteActor<R, N>;
};

function reviver(_key: string, value: unknown) {
  if(isPIDLike(value)) {
    return new Uint8Array(value);
  }
  return value;
}

class ServerTarget implements Postable {
  spawning = new Map<number, [Process<Actor>, any[]]>;
  constructor(public path: string){
    const events = new EventSource(path + '/events');
    events.onmessage = (event) => {
      const message = JSON.parse(event.data, reviver);
      switch(message.type) {
        case 'send': {
          send(message.pid, message.message);
          break;
        }
        case 'new-pid': {
          let idx = systemIndex(message.old);
          let [ab, queue] = this.spawning.get(idx)!;
          let pid = new Uint8Array(ab);
          pid[4] = message.new[4];
          pid[5] = message.new[5];
          pid[6] = message.new[6];
          this.spawning.delete(idx);

          queue.forEach(message => {
            this.post(message);
          });
          // TODO do i even need?
          // I think so, people might have a copy of the old one.
          break;
        }
      }
      
      if(message.type === 'send') {
        
      }
    };
  }
  post(message: any) {
    // TODO replacer
    if(message.pid) {
      // TODO use a replacer
      message.pid = Array.from(new Uint8Array(message.pid));
    }
    
    fetch(this.path, {
      method: 'POST',
      body: JSON.stringify(message)
    });
  }
  listenToPort(port: MessagePort) {
    port.onmessage = ev => {
      if(ev.data.type === 'spawn') {
        this.spawning.set(systemIndex(new Uint8Array(ev.data.pid) as any), [ev.data.pid, []]);
      } else if(ev.data.type === 'update' && this.spawning.has(systemIndex(new Uint8Array(ev.data.pid) as any))) {
        // queue up until we know the id
        this.spawning.get(systemIndex(new Uint8Array(ev.data.pid) as any))![1].push(ev.data);
        return;
      }
      this.post(ev.data);
    };
  }
  postMessage(message: any, transfer: Transferable[]) {
    this.listenToPort(transfer[0] as MessagePort);
    this.post(message);
  }
}

function connect<R extends Registry>(target: Postable | string): Connection<R> {
  if(typeof target === 'string') {
    target = new ServerTarget(target);
  }
  let id = addSystem(target);
  return {
    system: id,
    expose(name) {
      return new RemoteActor(id, name);
    }
  }
}

export {
  type Postable,

  connect,
  RemoteActor,
}