import type { Actor, ActorType, Message } from './actor';
import type { Postable } from './connection';
import {
  type Process,
  createPID,
  systemIndex,
  isNode
} from './pid.js';
import { RemoteActor } from './connection.js';

let _pid = Symbol.for('pid');

let systemId = isNode ? 1 : 0;
let systems = new Map<number, Postable>();
let pids = new Map<number, Actor>();
let pidi = 0;

function incrementPidi() {
  return pidi++;
}

function channelHandler(ev: MessageEvent<any>) {
  if(ev.data.type === 'send') {
    send(new Uint8Array(ev.data.pid) as any, ev.data.message);
  }
}

function addSystem(target: Postable): number {
  let current = Array.from(systems.values());
  let last = Array.from(systems.keys()).at(-1) ?? 1; // 1 is reserved for server
  let next = last + 1;

  // Tell this new system its id
  let channel = new MessageChannel();
  target.postMessage({ type: 'system', system: next }, [channel.port2]);
  channel.port1.addEventListener('message', channelHandler);
  channel.port1.start();

  systems.set(next, channel.port1);

  // TODO Tell existing systems about this new one.

  return next;
}

function updateSystem(system: number, port: MessagePort) {
  systems.set(system, port);
}

function inThisSystem(pid: Process<Actor>) {
  return pid[3] === systemId;
}

function getActorFromPID(pid: Process<Actor>) {
  return pids.get(systemIndex(pid));
}

function getPIDFromActor(actor: Actor): Process<Actor> {
  return (actor as any)[_pid];
}

function setSystemId(i: number) {
  systemId = i;
}

function getSystem(systemId: number) {
  return systems.get(systemId);
}

// TODO remove
function spawnWithPid<A extends ActorType>(ActorType: A, pid: Process<InstanceType<A>>, ...args: any[]): Process<InstanceType<A>> {
  let actor = new ActorType(...args);
  // TODO replace PID if created

  pids.set(systemIndex(pid), actor);
  (actor as any)[_pid] = pid;
  return pid as any;
}

type GetActorType<AOR extends ActorType | RemoteActor> = AOR extends RemoteActor ? AOR['_actor'] : AOR;

function spawn<
  AOR extends ActorType | RemoteActor,
  A extends GetActorType<AOR>
>(ActorType: AOR, ...args: ConstructorParameters<A>): Process<InstanceType<A>> {
  let pid: Process<InstanceType<A>> = 0 as any;
  if(ActorType instanceof RemoteActor) {
    pid = createPID(0) as any;
    pid[3] = ActorType.system;
    let system = getSystem(ActorType.system);
    system?.postMessage({
      type: 'spawn',
      name: ActorType.name,
      pid: pid.buffer,
    });
  } else {
    let actor = new (ActorType as any)(...args);
    pid = (actor as any)[_pid] ?? createPID(incrementPidi()) as Process<InstanceType<A>>;

    pids.set(systemIndex(pid), actor);
    (actor as any)[_pid] = pid;
  }

  return pid as any;
}

function send<P extends Process<Actor>>(pid: P, message: Message<P['actor']>) {
  if(inThisSystem(pid)) {
    let actor = getActorFromPID(pid);
    if(actor) {
      deliver(actor, message);
    }
  } else {
    let system = getSystem(pid[3]);
    system?.postMessage({
      type: 'send',
      pid: pid.buffer,
      message,
    });
  }
}

function deliver(actor: Actor, message: [string, any]) {
  // TODO check inbox
  actor.receive(message);
}

function process<A extends Actor>(actor: A): Process<A> {
  return (actor as any)[_pid] ?? ((actor as any)[_pid] = createPID(incrementPidi()));
}

export {
  addSystem,
  getActorFromPID,
  getPIDFromActor,
  getSystem,
  incrementPidi,
  inThisSystem,
  process,
  send,
  setSystemId,
  systemId,
  updateSystem,
  spawn,
  spawnWithPid
}