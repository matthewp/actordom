import type {
  Actor,
  ActorType,
  DOMActor,
  MessageName,
} from './actor.js';
import type { Process } from './pid.js';
import type { Registry } from './register.js';
import { update, _root } from './update.js';
import { process, send, spawn } from './system.js';

type Postable = {
  postMessage: typeof Worker.prototype['postMessage'];
}

function expose<R extends Registry, N extends keyof R = keyof R>(worker: Postable, name: N): R[N] {
  return class {
    constructor() {
      let pid = process(this);
      worker.postMessage({
        pid
      });
    }
    receive(){}
  } as any
}

export {
  type Actor,
  type ActorType,
  type DOMActor,
  type MessageName,
  type Process,

  expose,
  process,
  send,
  spawn,
  _root as root,
  update
};