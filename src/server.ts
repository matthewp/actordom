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

function serverSide(port: MessagePort) {
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

function clientSide(port: MessagePort) {
  port.onmessage = ev => {
    let raw = ev.data;
    if(raw.type !== 'send') {
      throw new Error(`Unknown message`)
    }
    sender(raw);
  };
  port.start();
}

// TODO wrong! this is shared by everyone.
let port2: MessagePort;

const handler = (ev: MessageEvent<any>) => {
  switch(ev.data.type) {
    case 'system': {
      setSystemId(ev.data.system);
      let channel = new MessageChannel();
      // TODO all wrong
      updateSystem(0, channel.port1);
      port2 = channel.port2;
      serverSide(channel.port1);
      clientSide(port2);
      break;
    }
    default: {
      port2!.postMessage(ev.data);
      break;
    }
  }
};

function register<A extends ActorType, N extends string>(actor: A, name: N): Registry<N, A> {
  items[name] = actor;
  return {} as any;
}

let sender: any;
function  setSender(_sender: any) {
  sender = _sender;
}

export {
  type Actor,
  type ActorType,
  type DOMActor,
  type MessageName,
  type Process,

  handler,
  setSender,

  register,
  process,
  send,
  spawn,
  update
};