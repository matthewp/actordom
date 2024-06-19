import type { Actor } from "./actor.js";
import { SendMessage, sendMessage } from "./messages.js";
import { createFromProcessID, getSystem, isPID, type Process, type ProcessID } from "./pid.js";
import { exit, getActorFromPID, getMessenger, inThisSystem } from './system.js';
import { isTree } from "./tree.js";

const _ref = Symbol.for('ad.ref');

const registry = new FinalizationRegistry(cleanup);

function track(pid: Process<Actor>) {
  registry.register(pid, pid.i);
}

// TODO when to use this?
// TODO when sending to another thread
function increment(actor: Actor) {
  (actor as any)[_ref]++;
}

function decrement(pid: Process<Actor>, actor: Actor) {
  console.log("COUNT1", actor.constructor.name, actor[_ref]);
  (actor as any)[_ref]--;
  console.log("COUNT2", actor.constructor.name, actor[_ref]);
  if(actor[_ref] === 0) {
    exit(pid);
  }
}

function cleanup(pid: ProcessID) {
  let p = createFromProcessID(pid);
  if(inThisSystem(p)) {
    let actor = getActorFromPID(p);
    decrement(p, actor);
  } else {
    // Message the owner system to let them know to decrement
    let systemId = getSystem(p);
    let port = getMessenger(systemId);
    if(port) {
      sendMessage(port, {
        type: 'dec',
        pid: p,
      });
    }
  }
}

function crawl(item: unknown, cb: (pid: Process<Actor>) => void) {
  if(typeof item === 'object' && item != null) {
    if(isPID(item)) {
      cb(item);
      return;
    }
    for(let p in item) {
      crawl((item as any)[p], cb);
    }
  } else if(Array.isArray(item) && !isTree(item)) {
    item.forEach(inner => {
      crawl(inner, cb);
    });
  }
}

function scanIncoming([, content]: [string, any]) {
  crawl(content, pid => {
    if(inThisSystem(pid)) {
      track(pid);
      let actor = getActorFromPID(pid);
      increment(actor);
    } else {
      // Tell the home system that this is being tracked
      track(pid);
      let systemId = getSystem(pid);
      let port = getMessenger(systemId);
      if(port) {
        sendMessage(port, {
          type: 'inc',
          pid
        });
      }
    }
  });
}

export {
  _ref,
  track,
  increment,
  decrement,
  scanIncoming
}