import type { JSXInternal } from '../types/jsx';
import type { _renderPid, _slotPid } from './update.js';
import type { Process } from './pid.js';
import type { _pid } from './system.js';
import type { RenderActor } from './render.js';

// https://www.totaltypescript.com/concepts/the-prettify-helper
type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

interface Actor {
  receive(message: [string, any]): void;
  /* @internal */
  [_renderPid]?: Process<RenderActor>;
  /* @internal */
  [_pid]?: Process<this>;
  /* @internal */
  [_slotPid]?: Process<Actor>;
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