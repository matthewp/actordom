import type {
  Actor,
  ActorType,
  DOMActor,
  MessageName,
} from './actor.js';
import type { Process } from './pid.js';
import type { Registry } from './register.js';
import { process, send, spawn, spawnWithPid, setSystemId, updateSystem } from './system.js';
import { update, updateProcess } from './update.js';

const items: any = {};

function established(port: MessagePort) {
  port.onmessage = ev => {
    switch(ev.data.type) {
      case 'spawn': {
        let pid = new Uint8Array(ev.data.pid);
        let Item = items[ev.data.name];
        spawnWithPid(Item, pid as any);
        break;
      }
      case 'send': {
        let pid = new Uint8Array(ev.data.pid);
        send(pid as any, ev.data.message);
        break;
      }
      case 'update': {
        let pid = new Uint8Array(ev.data.pid);
        updateProcess(pid as any);
        break;
      }
    }
  };
  port.start();
}

self.addEventListener('message', ev => {
  switch(ev.data.type) {
    case 'system': {
      setSystemId(ev.data.system);
      updateSystem(0, ev.ports[0]);
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