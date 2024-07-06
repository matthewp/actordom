import type { ActorType } from './actor.js';
import type { ConnectionMessage } from './messages.js';
import { addSystemAlias, exit, sendM, spawnWithPid } from './system.js';
import { updateProcess } from './update.js';

type Routes<I extends Record<string, ActorType>> = {
  [k in keyof I]: I[k]
}

type MessageHandler = (message: ConnectionMessage) => void;

type Router<I extends Routes<Record<string, ActorType>>> = MessageHandler & {
  /** @internal */
  _routes: I;
}

type AnyRouter = Router<Routes<Record<string, ActorType>>>;

function router<I extends Record<string, ActorType>>(items: I): Router<I> {
  let router = createRemoteHandler(items) as Router<I>;
  router._routes = items;
  return router;
}

function createRemoteHandler(items: Record<string, ActorType>) {
  return function(message: ConnectionMessage) {
    switch(message.type) {
      case 'spawn': {
        let Item = items[message.name];
        spawnWithPid(Item, message.pid, ...message.args); //todo args
        break;
      }
      case 'send': {
        sendM(message.pid, message.message);
        break;
      }
      case 'update': {
        updateProcess(message.pid, message.renderPid, message.slotPid);
        break;
      }
      case 'alias': {
        addSystemAlias(message.system, message.alias);
        break;
      }
      case 'exit': {
        exit(message.pid);
        break;
      }
    }
  };
}

export {
  type AnyRouter,
  type Router,

  router
}
