import type { JSXInternal } from '../types/jsx';
import type { _renderPid, _slotPid } from './update.js';
import type { Process, ProcessID } from './pid.js';
import type { _pid, _pidi } from './system.js';
import type { _ref } from './gc.js';

// https://www.totaltypescript.com/concepts/the-prettify-helper
type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

interface Actor {
  receive(message: [string, any]): void;
  /* @internal */
  [_renderPid]?: Process<Actor>;
  /* @internal */
  [_pidi]?: ProcessID;
  /* @internal */
  [_pid]?: WeakRef<Process<Actor>>;
  /* @internal */
  [_slotPid]?: Process<Actor>;
  /* @internal */
  [_ref]?: number;
}

interface ActorType {
  new(...args: any[]): Actor;
}

type Message<A extends Actor> = Parameters<A['receive']>[0];
type MessageName<A extends Actor> = Message<A>[0];

interface ViewActor extends Actor {
  view(children?: any): JSXInternal.Element;
}

interface IActorWithMessage<M extends [string, any]> extends Actor {
  receive(message: M): void;
}
type ActorWithMessage<M extends [string, any]> = Prettify<IActorWithMessage<M>>;
type ProcessWithMessage<M extends [string, any]> = Process<ActorWithMessage<M>>;

export {
  _renderPid,
  type Actor,
  type ActorType,
  type ActorWithMessage,
  type ProcessWithMessage,
  type ViewActor,
  type Message,
  type MessageName,
};