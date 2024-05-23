import type {
  Actor,
  ActorType,
  DOMActor,
  MessageName,
} from './actor.js';
import type { Process } from './pid.js';
import type { Registry } from './register.js';
import { update, _root } from './update.js';
import { process, addSystem, send } from './system.js';

type Postable = {
  postMessage: typeof Worker.prototype['postMessage'];
};

class RemoteActor<R extends Registry = Registry, N extends keyof R = keyof R> {
  _actor: R[N] = 0 as any;
  constructor(public system: number, public name: N) {}
}

type Connection<R extends Registry> = {
  system: number;
  expose<N extends keyof R = keyof R>(name: N): RemoteActor<R, N>;
};

function connect<R extends Registry>(target: Postable): Connection<R> {
  if(typeof target === 'string') {
    let path = target as unknown as string;

    const events = new EventSource(path + '/events');
    events.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if(message.type === 'send') {
        send(message.pid, message.message);
      }
    };

    target = {
      addEventListener() {

      },
      postMessage(message: any, transfers: any[] = []) {
        let port = transfers[0] as MessagePort;
        port.onmessage = ev => {
          if(ev.data.pid) {
            ev.data.pid = Array.from(new Uint8Array(ev.data.pid));
          }
          fetch(path, {
            method: 'POST',
            body: JSON.stringify(ev.data)
          });
        };
        fetch(path, {
          method: 'POST',
          body: JSON.stringify(message)
        });
      }
    }
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