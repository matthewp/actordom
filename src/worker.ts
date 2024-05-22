import type {
  Actor,
  ActorType,
  DOMActor,
  MessageName,
} from './actor.js';
import type { Process } from './pid.js';
import type { Registry } from './register.js';
import { process, send, spawn } from './system.js';

self.addEventListener('message', ev => {
  console.log("EV", ev.data);
});

function register<A extends ActorType, N extends string>(actor: A, name: N): Registry<N, A> {
  return {} as any;
}

export {
  type Actor,
  type ActorType,
  type DOMActor,
  type MessageName,
  type Process,

  register,
  process,
  send,
  spawn
};