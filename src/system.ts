import type { Actor, ActorType, Message } from './actor';
import type { Postable } from './connection';
import {
  type Process,
  createPID,
  getSystem,
  getId,
  createPIDForSystem,
  isNode
} from './pid.js';
import { RemoteActor } from './connection.js';

const _pid = Symbol.for('pid');

let systemId = crypto.randomUUID();
let systems = new Map<string, Postable>();
let aliases = new Map<string, string>();
let pids = new Map<string, Actor>();

function channelHandler(ev: MessageEvent<any>) {
  if(ev.data.type === 'send') {
    send(ev.data.pid, ev.data.message);
  }
}

function addSystem(target: Postable): string {
  let system = crypto.randomUUID();

  // Tell this new system its id
  let channel = new MessageChannel();
  target.postMessage({ type: 'system', system, sender: systemId }, [channel.port2]);
  channel.port1.addEventListener('message', channelHandler);
  channel.port1.start();

  systems.set(system, channel.port1);

  // Tell this one about existing systems
  // TODO Tell existing systems about this new one.
  for(const [id, port] of systems) {
    if(id === system) {
      break;
    }
    let newChannel = new MessageChannel();
    // TODO reuse the 'system' message, adding self concept
    port.postMessage({ type: 'new-system', system }, [newChannel.port1]);
    channel.port1.postMessage({ type: 'new-system', system: id }, [newChannel.port2]);
  }

  return system;
}

function updateSystem(system: string, port: MessagePort) {
  systems.set(system, port);
}

function inThisSystem(pid: Process<Actor>) {
  let system = getSystem(pid);
  return system === systemId || aliases.get(system) === systemId;
}

function addSystemAlias(system: string, alias: string) {
  aliases.set(alias, system);
}

function addSelfAlias(alias: string) {
  addSystemAlias(systemId, alias);
}

function getActorFromPID(pid: Process<Actor>) {
  // TODO lookup alias as fallback
  return pids.get(getId(pid));
}

function getPIDFromActor(actor: Actor): Process<Actor> {
  return (actor as any)[_pid];
}

function getMessenger(systemId: string) {
  let port = systems.get(systemId);
  if(port !== undefined) return port;
  let alias = aliases.get(systemId);
  if(alias !== undefined) return systems.get(alias);
}

// TODO remove
function spawnWithPid<A extends ActorType>(ActorType: A, pid: Process<InstanceType<A>>, ...args: any[]): Process<InstanceType<A>> {
  let actor = new ActorType(...args);
  // TODO alias PID if created

  pids.set(getId(pid), actor);
  (actor as any)[_pid] = pid;
  return pid as any;
}

type GetActorType<AOR extends ActorType | RemoteActor> = AOR extends RemoteActor ? AOR['_actor'] : AOR;

function spawn<
  AOR extends ActorType | RemoteActor,
  A extends GetActorType<AOR>
>(ActorType: AOR, ...args: ConstructorParameters<A>): Process<InstanceType<A>> {
  let pid: Process<InstanceType<A>>;
  if(ActorType instanceof RemoteActor) {
    pid = createPIDForSystem(ActorType.system) as any;
    let system = getMessenger(ActorType.system);
    system?.postMessage({
      type: 'spawn',
      name: ActorType.name,
      pid: pid,
    });
  } else {
    let actor = new (ActorType as any)(...args);
    pid = (actor as any)[_pid] ?? createPID() as Process<InstanceType<A>>;

    pids.set(getId(pid), actor);
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
    let system = getSystem(pid);
    let msg = getMessenger(system);
    msg?.postMessage({
      type: 'send',
      pid: pid,
      message,
    });
  }
}

function deliver(actor: Actor, message: [string, any]) {
  // TODO check inbox
  actor.receive(message);
}

function process<A extends Actor>(actor: A): Process<A> {
  return (actor[_pid] ?? (actor[_pid] = createPID())) as Process<A>;
}

export {
  _pid,
  addSystem,
  addSystemAlias,
  addSelfAlias,
  getActorFromPID,
  getPIDFromActor,
  getMessenger,
  inThisSystem,
  process,
  send,
  systemId,
  updateSystem,
  spawn,
  spawnWithPid
}