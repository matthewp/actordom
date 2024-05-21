import type { Tree } from './tree.js';
import type { JSXInternal } from './jsx';
import type { Process } from './pid.js';
import { mount, update } from './update.js';
import { process, send, spawn } from './system.js';

interface Actor {
  receive(_message: [string, any]): void;
}

interface ActorType {
  new(...args: any[]): Actor;
}

type Message<A extends Actor> = Parameters<A['receive']>[0];
type MessageName<A extends Actor> = Message<A>[0];

interface DOMActor extends Actor {
  view(): Tree | JSXInternal.Element;
}

export {
  type Actor,
  type ActorType,
  type DOMActor,
  type Message,
  type MessageName,
  type Process,

  process,
  send,
  spawn,
  mount,
  update
};