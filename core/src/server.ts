import type {
  Actor,
  ActorType,
  DOMActor,
  MessageName,
} from './actor.js';
import { type ConnectionMessage, type SystemMessage, sendMessage } from './messages.js';
import type { Process, UUID } from './pid.js';
import { type AnyRouter, router } from './remote.js';
import { process, send, spawn, addSelfAlias, updateSystem, systemId, removeSystemAlias } from './system.js';
import { update } from './update.js';

type OverTheWireConnectionMessage = ConnectionMessage & { port: UUID; };

type MessageHandler = (message: OverTheWireConnectionMessage) => void;

function serverSide(onMessage: MessageHandler, router: AnyRouter, port: MessagePort) {
  port.onmessage = (ev: MessageEvent<OverTheWireConnectionMessage>) => {
    switch(ev.data.type) {
      case 'new-system': {
        let channel = new MessageChannel();
        updateSystem(ev.data.system, channel.port1);
        serverSide(onMessage, router, channel.port1);
        clientSide(onMessage, channel.port2, ev.data.port);
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

function clientSide(onMessage: MessageHandler, port: MessagePort, uuid: UUID) {
  port.onmessage = (ev: MessageEvent<OverTheWireConnectionMessage>) => {
    ev.data.port = uuid;
    onMessage(ev.data);
  };
  port.start();
}

function createBrowserConnection(router: AnyRouter, onMessage: MessageHandler) {
  let channel: MessageChannel;
  let alias: UUID;
  return {
    handle(ev: { data: OverTheWireConnectionMessage }) {
      switch(ev.data.type) {
        case 'system': {
          alias = ev.data.system;
          addSelfAlias(alias);
          channel = new MessageChannel();
          updateSystem(ev.data.sender, channel.port1);
          serverSide(onMessage, router, channel.port1);
          clientSide(onMessage, channel.port2, ev.data.port);
  
          // Tell the sender your real systemId.
          sendMessage(channel.port1, { type: 'alias', system: ev.data.system, alias: systemId });
          break;
        }
        default: {
          sendMessage(channel.port2, ev.data);
          break;
        }
      }
    },
    close() {
      channel.port1.close();
      channel.port2.close();
      removeSystemAlias(alias);
    }
  }
}

export {
  type Actor,
  type ActorType,
  type DOMActor,
  type MessageName,
  type Process,
  type OverTheWireConnectionMessage,

  createBrowserConnection,
  router,
  process,
  send,
  spawn,
  update
};