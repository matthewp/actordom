import type { Tree } from './tree.js';
import type { JSXInternal } from './jsx';
import { update } from './update.js';
import { ref } from './ref.js';

type Message<T extends string = string> = [T, any];

interface Actor {
  receive(_message: [string, any]): void;
}

interface ActorType {
  new(): Actor;
}

interface DOMActor extends Actor {
  root: Element | null;
  view(): Tree | JSXInternal.Element;
}


function deliver(actor: Actor, message: Message) {
  // TODO check inbox
  actor.receive(message);
}

const pidSym = Symbol.for('pid');
type PID<A extends Actor> = {
  actor: A;
  i: number;
  [pidSym]: true
}

function createPID(i: number, actor: Actor): PID<typeof actor> {
  return { i } as any;
}

class System {
  pids = new Map<number, Actor>();
  pidi = 0;

  send<P extends PID<Actor>>(pid: P, message: Parameters<P['actor']['receive']>[0]) {
    let actor = this.pids.get(pid.i);
    if(actor) {
      deliver(actor, message);
    }
  }

  spawn<A extends ActorType>(ActorType: A): PID<InstanceType<A>> {
    let actor = new ActorType();
    let pid = createPID(this.pidi++, actor);
    
    (actor as any)[pidSym] = pid;
    this.pids.set(pid.i, actor);
    return pid as any;
  }
}



export {
  type Actor,
  type DOMActor,
  System,

  ref,
  update
}