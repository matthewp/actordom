import type { Actor, ActorType, Message } from './main';
import {
  type Process,
  createPID,
  systemIndex
} from './pid.js';

let _pid = Symbol.for('pid');
let pids = new Map<number, Actor>();
let pidi = 0;

function getActorFromPID(pid: Process<Actor>) {
  return pids.get(systemIndex(pid));
}

function send<P extends Process<Actor>>(pid: P, message: Message<P['actor']>) {
  let actor = getActorFromPID(pid);
  if(actor) {
    deliver(actor, message);
  }
}

function spawn<A extends ActorType>(ActorType: A, ...args: ConstructorParameters<A>): Process<InstanceType<A>> {
  let actor = new ActorType(...args);
  let pid = (actor as any)[_pid] ?? createPID(pidi++) as Process<InstanceType<A>>;

  pids.set(systemIndex(pid), actor);
  (actor as any)[_pid] = pid;
  return pid as any;
}

function deliver(actor: Actor, message: [string, any]) {
  // TODO check inbox
  actor.receive(message);
}

function process<A extends Actor>(actor: A): Process<A> {
  return (actor as any)[_pid] ?? ((actor as any)[_pid] = createPID(pidi++));
}

export {
  getActorFromPID,
  process,
  send,
  spawn
}