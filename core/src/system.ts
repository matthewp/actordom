import type { Actor, ActorType, Message } from './actor';
import type { Postable } from './connection';
import { type ConnectionMessage, type SendMessage, type ExitMessage, sendMessage } from './messages.js';
import {
  type Process,
  type UUID,
  createPID,
  getSystem,
  getId,
  createPIDForSystem,
} from './pid.js';
import { RemoteActor } from './connection.js';
import { _renderPid, _slotPid } from './update.js';

const _pid = Symbol.for('ad.pid');

let systemId = crypto.randomUUID();
let systems = new Map<UUID, Postable>();
let aliases = new Map<UUID, UUID>();
let pids = new Map<UUID, Actor>();

function unknownSystem(system: UUID) {
  new Error(`Unknown port: ${system}`)
}

function channelHandler(ev: MessageEvent<SendMessage | ExitMessage>) {
  let message = ev.data;
  switch(message.type) {
    case 'send': {
      sendM(message.pid, message.message);
      break;
    }
  }
}

function addSystem(target: Postable): UUID {
  let system = crypto.randomUUID();

  // Tell this new system its id
  let channel = new MessageChannel();
  sendMessage(target, { type: 'system', system, sender: systemId }, [channel.port2]);
  channel.port1.onmessage = channelHandler;
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
    sendMessage(channel.port2, { type: 'new-system', system: id }, [newChannel.port2]);
  }

  return system;
}

function messageAllSystems(message: ConnectionMessage, transfer?: Transferable[]) {
  for(const [_id, port] of systems) {
    sendMessage(port, message, transfer);
  }
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

function getMessenger(systemId: UUID) {
  let port = systems.get(systemId);
  if(port !== undefined) return port;
  let alias = aliases.get(systemId);
  if(alias !== undefined) return systems.get(alias);
}

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
>(ActorConstructor: AOR, ...args: ConstructorParameters<A>): Process<InstanceType<A>> {
  let pid: Process<InstanceType<A>>;
  if(ActorConstructor instanceof RemoteActor) {
    pid = createPIDForSystem(ActorConstructor.system) as any;
    let port = getMessenger(ActorConstructor.system);
    if(!port) {
      throw unknownSystem(ActorConstructor.system);
    }
    sendMessage(port, {
      type: 'spawn',
      name: ActorConstructor.name,
      pid,
      args
    });
  } else {
    let actor = new (ActorConstructor as ActorType)(...args) as InstanceType<A>;
    pid = actor[_pid] ?? createPID<InstanceType<A>>();

    pids.set(getId(pid), actor);
    actor[_pid] = pid;
  }

  return pid;
}

function sendM<
  P extends Process<Actor>,
>(pid: P, message: Message<P['actor']>) {
  if(inThisSystem(pid)) {
    let actor = getActorFromPID(pid);
    if(actor) {
      deliver(actor, message);
    }
  } else {
    let system = getSystem(pid);
    let port = getMessenger(system);
    if(!port) {
      throw unknownSystem(system);
    }
    sendMessage(port, {
      type: 'send',
      pid,
      message,
    });
  }
}

function send<
  P extends Process<Actor>,
  M extends Message<P['actor']>,
  S extends M[0],
  D extends { [K in M as K[0]]: K[1] }[S]
>(pid: P, message: S, data: D) {
  return sendM(pid, [message, data]);
}

function exit(pid: Process<Actor>) {
  if(inThisSystem(pid)) {
    let actor = getActorFromPID(pid);
    let renderPid = actor[_renderPid];
    if(renderPid) {
      exit(renderPid);
    }
    let slotPid = actor[_slotPid];
    if(slotPid) {
      exit(slotPid);
    }
    // Delete this id from the system
    pids.delete(getId(pid));
  } else {
    let system = getSystem(pid);
    let port = getMessenger(system);
    if(!port) {
      throw unknownSystem(system);
    }
    sendMessage(port, {
      type: 'exit',
      pid
    });
  }
}

function deliver(actor: Actor, message: [string, any]) {
  // TODO check inbox
  actor.receive(message);
}

function process<A extends Actor>(actor: A): Process<A> {
  let pid: Process<A>;
  if(_pid in actor) {
    pid = actor[_pid]!;
  } else {
    pid = createPID<A>();
    actor[_pid] = pid;
  }
  return pid;
}

function pidCount() {
  return Array.from(pids.keys()).length;
}

export {
  _pid,
  addSystem,
  addSystemAlias,
  exit,
  removeSystemAlias,
  addSelfAlias,
  getActorFromPID,
  getMessenger,
  inThisSystem,
  messageAllSystems,
  pidCount,
  process,
  send,
  sendM,
  systemId,
  updateSystem,
  spawn,
  spawnWithPid
}