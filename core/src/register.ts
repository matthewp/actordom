import type { Actor, ActorType } from './actor.js';
import type { AnyRouter } from './remote.js';
import type { Process } from './pid.js';

const registry = new Map<string, Process<Actor>>();

function register<
  R extends AnyRouter = AnyRouter
>(name: keyof R['routes'], pid: Process<Actor>) {
  registry.set(name as any, pid);
}

function registered(): string[] {
  return Array.from(registry.keys());
}

type StringOnly<U> = U extends string ? U : never;

function whereis<
  R extends AnyRouter = AnyRouter
>(name: StringOnly<keyof R['routes']>)  {
  return registry.get(name) as Process<InstanceType<Extract<R['routes'][typeof name], ActorType>>>;
}

export {
  register,
  registered,
  whereis,
};
