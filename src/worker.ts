import type {
  Actor,
  ActorType,
  DOMActor,
  MessageName,
} from './actor.js';
import type { Process } from './pid.js';
import type { Registry } from './register.js';
import { addSelfAlias, process, send, spawn, spawnWithPid, updateSystem } from './system.js';
import { update, updateProcess } from './update.js';

const items: any = {};

function established(port: MessagePort) {
  port.onmessage = ev => {
    switch(ev.data.type) {
      case 'spawn': {
        let Item = items[ev.data.name];
        spawnWithPid(Item, ev.data.pid);
        break;
      }
      case 'send': {
        send(ev.data.pid, ev.data.message);
        break;
      }
      case 'update': {
        updateProcess(ev.data.pid, ev.data.renderPid);
        break;
      }
      case 'new-system': {
        updateSystem(ev.data.system, ev.ports[0]);
        break;
      }
    }
  };
  port.start();
}

self.addEventListener('message', ev => {
  switch(ev.data.type) {
    case 'system': {
      addSelfAlias(ev.data.system);
      updateSystem(ev.data.sender, ev.ports[0]);
      established(ev.ports[0]);
      break;
    }
    case 'new-system': {
      
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