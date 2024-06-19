import type { ActorType } from './actor.js';
import { decrement, increment, scanIncoming } from './gc.js';
import type { ConnectionMessage } from './messages.js';
import { getActorFromPID, inThisSystem, send, spawnWithPid } from './system.js';
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
  let router = createRemoteHandler(items);
  return router as Router<I>;
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
        setTimeout(scanIncoming, 1, message.message);
        send(message.pid, message.message);
        break;
      }
      case 'update': {
        updateProcess(message.pid, message.renderPid, message.slotPid);
        break;
      }
      case 'inc':
      case 'dec': {
        let actor = getActorFromPID(message.pid);
        if(message.type === 'inc') {
          increment(actor);
        } else {
          decrement(message.pid, actor);
        }
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