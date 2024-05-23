import type {
  Actor,
  ActorType,
  DOMActor,
  MessageName,
} from './actor.js';
import type { Process } from './pid.js';
import type { Registry } from './register.js';
import { process, send, spawn, getActorFromPID, spawnWithPid, addSelfAlias, updateSystem, systemId } from './system.js';
import { update, updateProcess } from './update.js';

const items: any = {};

function serverSide(port: MessagePort) {
  port.onmessage = ev => {
    switch(ev.data.type) {
      case 'spawn': {
        let Item = items[ev.data.name];
        spawnWithPid(Item, ev.data.pid); //todo args
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
    }
  };
  port.start();
}

function clientSide(port: MessagePort) {
  port.onmessage = ev => {
    sender(ev.data);
  };
  port.start();
}

// TODO wrong! this is shared by everyone.
let port2: MessagePort;

const handler = (ev: MessageEvent<any>) => {
  switch(ev.data.type) {
    case 'system': {
      addSelfAlias(ev.data.system);
      let channel = new MessageChannel();
      // TODO all wrong?
      updateSystem(ev.data.sender, channel.port1);
      port2 = channel.port2;
      serverSide(channel.port1);
      clientSide(port2);

      // Tell the sender your real systemId.
      channel.port1.postMessage({ type: 'alias', system: ev.data.system, alias: systemId });
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