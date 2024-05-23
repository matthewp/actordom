import type {
  Actor,
  ActorType,
  DOMActor,
  MessageName,
} from './actor.js';
import type { Process } from './pid.js';
import { } from './pid.js';
import type { Registry } from './register.js';
import { update, _root } from './update.js';
import { process, addSystem, addSystemAlias, send } from './system.js';

type Postable = {
  postMessage(message: any, transfer?: Transferable[]): void;
};

class RemoteActor<R extends Registry = Registry, N extends keyof R = keyof R> {
  _actor: R[N] = 0 as any;
  constructor(public system: string, public name: N) {}
}

type Connection<R extends Registry> = {
  system: string;
  expose<N extends keyof R = keyof R>(name: N): RemoteActor<R, N>;
};

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
  listenToPort(port: MessagePort) {
    port.onmessage = ev => {
      console.log("WHA", ev.data);
      if(ev.data.type === 'new-system') {
        debugger;
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
    this.listenToPort(transfer[0] as MessagePort);
    if(!this.opened) {
      this.queued.push(message);
      return;
    }
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