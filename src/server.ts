import type {
  Actor,
  ActorType,
  DOMActor,
  MessageName,
} from './actor.js';
import { type ConnectionMessage, type SystemMessage, sendMessage } from './messages.js';
import type { Process, UUID } from './pid.js';
import type { Registry } from './register.js';
import { process, send, spawn, spawnWithPid, addSelfAlias, updateSystem, systemId } from './system.js';
import { update, updateProcess } from './update.js';

type OverTheWireSystemMessage = SystemMessage & { port: UUID; };
type OverTheWireConnectionMessage = ConnectionMessage & { port: UUID; };

const items: any = {};

function serverSide(port: MessagePort) {
  port.onmessage = (ev: MessageEvent<OverTheWireConnectionMessage>) => {
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
      case 'new-system': {
        let channel = new MessageChannel();
        updateSystem(ev.data.system, channel.port1);
        serverSide(channel.port1);
        clientSide(channel.port2, ev.data.port);
        break;
      }
    }
  };
  port.start();
}

function clientSide(port: MessagePort, uuid: string) {
  port.onmessage = ev => {
    sender(ev.data);
  };
  port.start();
}

// TODO wrong! this is shared by everyone.
let port2: MessagePort;

const handler = (ev: MessageEvent<OverTheWireSystemMessage>) => {
  switch(ev.data.type) {
    case 'system': {
      addSelfAlias(ev.data.system);
      let channel = new MessageChannel();
      // TODO all wrong?
      updateSystem(ev.data.sender, channel.port1);
      port2 = channel.port2;
      serverSide(channel.port1);
      clientSide(port2, ev.data.port);

      // Tell the sender your real systemId.
      sendMessage(channel.port1, { type: 'alias', system: ev.data.system, alias: systemId });
      break;
    }
    default: {
      sendMessage(port2, ev.data);
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