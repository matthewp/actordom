import type { Tree } from './tree.js';
import type { JSXInternal } from './jsx';
import { mount, update } from './update.js';
import { send, spawn } from './system.js';

interface Actor {
  receive(_message: [string, any]): void;
}

interface ActorType {
  new(): Actor;
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

  send,
  spawn,
  mount,
  update
}