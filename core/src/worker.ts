import type {
  Actor,
  ActorType,
  ViewActor,
  MessageName,
  ProcessWithMessage,
  ActorWithMessage,
} from './actor.js';
import type { ConnectionMessage } from './messages.js';
import type { Process } from './pid.js';
import { type AnyRouter, router } from './remote.js';
import { addSelfAlias, messageAllSystems, process, send, spawn, systemId, updateSystem } from './system.js';
import { update } from './update.js';

type MessageHandler = (ev: MessageEvent) => void;
type MessageListener = {
  addEventListener(name: string, cb: MessageHandler): void;
  removeEventListener(name: string, cb: MessageHandler): void;
};

function listen(router: AnyRouter, target: MessageListener = self) {
  const handler = (ev: MessageEvent) => {
    switch(ev.data.type) {
      case 'system': {
        let alias = ev.data.system;
        addSelfAlias(alias);
        messageAllSystems({
          type: 'alias',
          system: systemId,
          alias,
        });
        updateSystem(ev.data.sender, ev.ports[0]);
        established(ev.ports[0], router);
        break;
      }
    }
  };
  target.addEventListener('message', handler);
  return () => target.removeEventListener('message', handler);
}

function established(port: MessagePort, router: AnyRouter) {
  port.onmessage = (ev: MessageEvent<ConnectionMessage>) => {
    switch(ev.data.type) {
      case 'new-system': {
        updateSystem(ev.data.system, ev.ports[0]);
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

export {
  type Actor,
  type ActorType,
  type ActorWithMessage,
  type ViewActor,
  type MessageName,
  type Process,
  type ProcessWithMessage,

  process,
  send,
  spawn,
  update,

  router,
  listen
};