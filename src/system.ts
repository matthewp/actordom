import type { Actor, ActorType, Message } from './main';
import {
  type PID,
  createPID,
  systemIndex
} from './pid.js';

let _pid = Symbol.for('pid');
let pids = new Map<number, Actor>();
let pidi = 0;

function getActorFromPID(pid: PID<Actor>) {
  return pids.get(systemIndex(pid));
}

function send<P extends PID<Actor>>(pid: P, message: Message<P['actor']>) {
  let actor = getActorFromPID(pid);
  if(actor) {
    deliver(actor, message);
  }
}

function spawn<A extends ActorType>(ActorType: A): PID<InstanceType<A>> {
  let actor = new ActorType();
  let pid = createPID(pidi++, actor);
  
  pids.set(systemIndex(pid), actor);
  (actor as any)[_pid] = pid;
  return pid as any;
}

function deliver(actor: Actor, message: [string, any]) {
  // TODO check inbox
  actor.receive(message);
}

export {
  getActorFromPID,
  send,
  spawn,

  _pid
}