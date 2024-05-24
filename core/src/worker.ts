import type {
  Actor,
  ActorType,
  DOMActor,
  MessageName,
} from './actor.js';
import type { ConnectionMessage, SystemMessage } from './messages.js';
import type { Process } from './pid.js';
import type { Registry } from './register.js';
import { createRemoteHandler } from './remote.js';
import { addSelfAlias, process, send, spawn, updateSystem } from './system.js';
import { update } from './update.js';

const items: Record<string, ActorType> = Object.create(null);

function established(port: MessagePort) {
  const defaultHandler = createRemoteHandler(items);
  port.onmessage = (ev: MessageEvent<ConnectionMessage>) => {
    switch(ev.data.type) {
      case 'new-system': {
        updateSystem(ev.data.system, ev.ports[0]);
        break;
      }
      default: {
        defaultHandler(ev.data);
        break;
      }
    }
  };
  port.start();
}

self.addEventListener('message', (ev: MessageEvent<SystemMessage> ) => {
  switch(ev.data.type) {
    case 'system': {
      addSelfAlias(ev.data.system);
      updateSystem(ev.data.sender, ev.ports[0]);
      established(ev.ports[0]);
      break;
    }
  }
});

function register<A extends ActorType, N extends string>(actor: A, name: N): Registry<N, A> {
  items[name] = actor;
  return {} as any;
}

export {
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
};