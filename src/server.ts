import type {
  Actor,
  ActorType,
  DOMActor,
  MessageName,
} from './actor.js';
import { type ConnectionMessage, type SystemMessage, sendMessage } from './messages.js';
import type { Process, UUID } from './pid.js';
import type { Registry } from './register.js';
import { createRemoteHandler } from './remote.js';
import { process, send, spawn, addSelfAlias, updateSystem, systemId } from './system.js';
import { update } from './update.js';

type OverTheWireSystemMessage = SystemMessage & { port: UUID; };
type OverTheWireConnectionMessage = ConnectionMessage & { port: UUID; };

type Sender = (message: OverTheWireConnectionMessage) => void;

const items: Record<string, ActorType> = {};

function serverSide(sender: Sender, port: MessagePort) {
  const defaultHandler = createRemoteHandler(items);
  port.onmessage = (ev: MessageEvent<OverTheWireConnectionMessage>) => {
    switch(ev.data.type) {
      case 'new-system': {
        let channel = new MessageChannel();
        updateSystem(ev.data.system, channel.port1);
        serverSide(sender, channel.port1);
        clientSide(sender, channel.port2, ev.data.port);
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

function clientSide(sender: Sender, port: MessagePort, uuid: UUID) {
  port.onmessage = (ev: MessageEvent<OverTheWireConnectionMessage>) => {
    ev.data.port = uuid;
    sender(ev.data);
  };
  port.start();
}

function createHandler(sender: Sender) {
  // TODO wrong! this is shared by everyone.
  let port2: MessagePort;

  const handler = (ev: { data: OverTheWireSystemMessage }) => {
    switch(ev.data.type) {
      case 'system': {
        addSelfAlias(ev.data.system);
        let channel = new MessageChannel();
        updateSystem(ev.data.sender, channel.port1);
        port2 = channel.port2;
        serverSide(sender, channel.port1);
        clientSide(sender, port2, ev.data.port);

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

  return handler;
}

function register<A extends ActorType, N extends string>(actor: A, name: N): Registry<N, A> {
  items[name] = actor;
  return {} as Registry<N, A>;
}

export {
  type Actor,
  type ActorType,
  type DOMActor,
  type MessageName,
  type Process,

  createHandler,
  register,
  process,
  send,
  spawn,
  update
};