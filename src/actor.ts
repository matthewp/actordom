import type { Tree } from './tree.js';
import type { JSXInternal } from './jsx';
import type { _renderPid } from './update.js';
import type { Process } from './pid.js';
import type { _pid } from './system.js';


interface Actor {
  receive(_message: [string, any]): void;
  /* @internal */
  [_renderPid]?: Process<Actor>;
  /* @internal */
  [_pid]?: Process<Actor>;
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
  _renderPid,
  type Actor,
  type ActorType,
  type DOMActor,
  type Message,
  type MessageName,
};