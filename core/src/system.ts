import type { Actor, ActorType, Message } from './actor';
import type { Postable } from './connection';
import { sendMessage } from './messages.js';
import {
  type Process,
  type UUID,
  createPID,
  getSystem,
  getId,
  createPIDForSystem,
} from './pid.js';
import { RemoteActor } from './connection.js';

const _pid = Symbol.for('pid');

let systemId = crypto.randomUUID();
let systems = new Map<UUID, Postable>();
let aliases = new Map<UUID, UUID>();
let pids = new Map<UUID, Actor>();

function channelHandler(ev: MessageEvent<any>) {
  if(ev.data.type === 'send') {
    send(ev.data.pid, ev.data.message);
  }
}

function addSystem(target: Postable): UUID {
  let system = crypto.randomUUID();

  // Tell this new system its id
  let channel = new MessageChannel();
  sendMessage(target, { type: 'system', system, sender: systemId }, [channel.port2]);
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
    sendMessage(port, { type: 'new-system', system }, [newChannel.port1]);
    sendMessage(channel.port1, { type: 'new-system', system: id }, [newChannel.port2]);
  }

  return system;
}

function updateSystem(system: UUID, port: MessagePort) {
  systems.set(system, port);
}

function inThisSystem(pid: Process<Actor>) {
  let system = getSystem(pid);
  return system === systemId || aliases.get(system) === systemId;
}

function addSystemAlias(system: UUID, alias: UUID) {
  aliases.set(alias, system);
}

function addSelfAlias(alias: UUID) {
  addSystemAlias(systemId, alias);
}

function removeSystemAlias(alias: UUID) {
  aliases.delete(alias);
}

function getActorFromPID<A extends Actor>(pid: Process<A>) {
  // TODO lookup alias as fallback
  return pids.get(getId(pid)) as A;
}

function getPIDFromActor(actor: Actor): Process<Actor> {
  return actor[_pid]!;
}

function getMessenger(systemId: UUID) {
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
  actor[_pid] = pid;
  return pid;
}

type GetActorType<AOR extends ActorType | RemoteActor> = AOR extends RemoteActor ? AOR['_actor'] : AOR;

function spawn<
  AOR extends ActorType | RemoteActor,
  A extends GetActorType<AOR>
>(ActorType: AOR, ...args: ConstructorParameters<A>): Process<InstanceType<A>> {
  let pid: Process<InstanceType<A>>;
  if(ActorType instanceof RemoteActor) {
    pid = createPIDForSystem(ActorType.system) as any;
    let port = getMessenger(ActorType.system);
    if(!port) {
      throw new Error(`Unknown system: ${ActorType.system}`);
    }
    sendMessage(port, {
      type: 'spawn',
      name: ActorType.name,
      pid: pid,
      args
    });
  } else {
    let actor = new (ActorType as any)(...args);
    pid = actor[_pid] ?? createPID() as Process<InstanceType<A>>;

    pids.set(getId(pid), actor);
    actor[_pid] = pid;
  }

  return pid;
}

function send<P extends Process<Actor>>(pid: P, message: Message<P['actor']>) {
  if(inThisSystem(pid)) {
    let actor = getActorFromPID(pid);
    if(actor) {
      deliver(actor, message);
    }
  } else {
    let system = getSystem(pid);
    let port = getMessenger(system);
    if(!port) {
      throw new Error(`Unknown port: ${system}`)
    }
    sendMessage(port, {
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
  removeSystemAlias,
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