import type { ActorType, ViewActorType } from './actor.js';
import { isPlainFunction } from './common.js';
import type { ConnectionMessage } from './messages.js';
import { addSystemAlias, exit, sendM, spawnWithPid } from './system.js';
import { updateProcess } from './update.js';

type AsyncActorTypeFn<A extends ActorType = ActorType> = () => Promise<A>;

type RouteRecord<A extends ActorType = ActorType> = Record<string, A | AsyncActorTypeFn<A>>; 

type Routes<I extends RouteRecord> = {
  [k in keyof I]: I[k];
};

type MessageHandler = (message: ConnectionMessage) => void;

type Router<I extends Routes<RouteRecord>> = MessageHandler & {
  routes: I;
};

type AnyRouter = Router<Routes<RouteRecord>>;
type ViewRouter = Router<Routes<RouteRecord<ViewActorType>>>;

class Test {
  receive(){}
}

router({
  Test: () => Promise.resolve(Test)
})

function router<I extends RouteRecord>(items: I): Router<I> {
  let router = createRemoteHandler(items) as Router<I>;
  router.routes = items;
  return router;
}

function createRemoteHandler(items: RouteRecord) {
  return function(message: ConnectionMessage) {
    switch(message.type) {
      case 'spawn': {
        let Item = items[message.name];
        if(isPlainFunction<AsyncActorTypeFn>(Item)) {
          Item().then(ActorType => spawnWithPid(ActorType, message.pid, ...message.args));
          return;
        }
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
  type ViewRouter,
  router
}
