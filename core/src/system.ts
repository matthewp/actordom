import type { Actor, ActorType, Message } from './actor';
import type { Postable } from './connection';
import { type DecMessage, type IncMessage, type SendMessage, sendMessage } from './messages.js';
import {
  type Process,
  type UUID,
  createPID,
  getSystem,
  getId,
  createPIDForSystem,
  createFromProcessID,
} from './pid.js';
import { RemoteActor } from './connection.js';
import { _ref, decrement, increment, scanIncoming, track } from './gc.js';

const _pid = Symbol.for('ad.pid');
const _pidi = Symbol.for('ad.pidi');

let systemId = crypto.randomUUID();
let systems = new Map<UUID, Postable>();
let aliases = new Map<UUID, UUID>();
let pids = new Map<UUID, Actor>();

function channelHandler(ev: MessageEvent<SendMessage | IncMessage | DecMessage>) {
  let message = ev.data;
  switch(message.type) {
    case 'send': {
      setTimeout(scanIncoming, 1, message.message);
      send(message.pid, message.message);
      break;
    }
    case 'inc':
    case 'dec': {
      let actor = getActorFromPID(message.pid);
      if(message.type === 'inc') {
        increment(actor);
      } else {
        decrement(message.pid, actor);
      }
      break;
    }
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
  actor[_pidi] = pid.i;
  actor[_pid] = new WeakRef(pid);
  actor[_ref] = 1;
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
    // TODO transfer ownership
    sendMessage(port, {
      type: 'spawn',
      name: ActorType.name,
      pid: pid,
      args
    });
  } else {
    let actor = new (ActorType as any)(...args) as Actor;
    if(_pid in actor) {
      let p = actor[_pid]!.deref();
      if(!p) {
        p = createFromProcessID(actor[_pidi]!);
        actor[_pid] = new WeakRef(p);
        increment(actor);
        track(p);
      }
      pid = p as Process<InstanceType<A>>;
    } else {
      pid = createPID() as Process<InstanceType<A>>;
      actor[_pid] = new WeakRef(pid);
      actor[_ref] = 1;
      track(pid);
    }

    pids.set(getId(pid), actor);
    actor[_pidi] = pid.i;
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
    // TODO scan
    sendMessage(port, {
      type: 'send',
      pid,
      message,
    });
  }
}

function exit(pid: Process<Actor>) {
  if(inThisSystem(pid)) {
    // Delete this id from the system
    pids.delete(getId(pid));
    console.log("PID COUNT", Array.from(pids.keys()).length);
  } else {
    console.log('exiting', pid.i);
  }
}

function deliver(actor: Actor, message: [string, any]) {
  // TODO check inbox
  actor.receive(message);
}

function process<A extends Actor>(actor: A): Process<A> {
  let pid: Process<A>;
  if(actor[_pid]) {
    let p = actor[_pid].deref();
    if(!p) {
      p = createFromProcessID(actor[_pidi]!);
      increment(actor);
      track(p);
    }
    pid = p as Process<A>;
  } else {
    pid = createPID() as Process<A>;
    actor[_pid] = new WeakRef(pid);
    actor[_pidi] = pid.i;
    actor[_ref] = 1;
    track(pid);
  }
  return pid;
}

export {
  _pid,
  _pidi,
  addSystem,
  addSystemAlias,
  exit,
  removeSystemAlias,
  addSelfAlias,
  getActorFromPID,
  getMessenger,
  inThisSystem,
  process,
  send,
  systemId,
  updateSystem,
  spawn,
  spawnWithPid
}