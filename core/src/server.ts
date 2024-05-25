import type {
  Actor,
  ActorType,
  DOMActor,
  MessageName,
} from './actor.js';
import { type ConnectionMessage, type SystemMessage, sendMessage } from './messages.js';
import type { Process, UUID } from './pid.js';
import { type AnyRouter, router } from './remote.js';
import { process, send, spawn, addSelfAlias, updateSystem, systemId } from './system.js';
import { update } from './update.js';

type OverTheWireSystemMessage = SystemMessage & { port: UUID; };
type OverTheWireConnectionMessage = ConnectionMessage & { port: UUID; };

type Sender = (message: OverTheWireConnectionMessage) => void;

function serverSide(sender: Sender, router: AnyRouter, port: MessagePort) {
  port.onmessage = (ev: MessageEvent<OverTheWireConnectionMessage>) => {
    switch(ev.data.type) {
      case 'new-system': {
        let channel = new MessageChannel();
        updateSystem(ev.data.system, channel.port1);
        serverSide(sender, router, channel.port1);
        clientSide(sender, channel.port2, ev.data.port);
        break;
      }
      default: {
        router(ev.data);
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

function createHandler(sender: Sender, router: AnyRouter) {
  // TODO wrong! this is shared by everyone.
  let port2: MessagePort;

  const handler = (ev: { data: OverTheWireSystemMessage }) => {
    switch(ev.data.type) {
      case 'system': {
        addSelfAlias(ev.data.system);
        let channel = new MessageChannel();
        updateSystem(ev.data.sender, channel.port1);
        port2 = channel.port2;
        serverSide(sender, router, channel.port1);
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

export {
  type Actor,
  type ActorType,
  type DOMActor,
  type MessageName,
  type Process,

  createHandler,
  router,
  process,
  send,
  spawn,
  update
};