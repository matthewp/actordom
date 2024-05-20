import { Tree, createTree } from './jsx-runtime.js';
import { render } from './render.js';

type Message<T extends string = string> = [T, any];

interface Actor {
  root: Element | null;
  view(): Tree;
  receive(_message: [string, any]): void;
}

interface ActorType {
  new(): Actor;
}

function update(actor: Actor) {
  if(actor.root !== null) {
    let tree = actor.view();
    render(tree, actor.root, actor);
  }
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

const _ref = Symbol.for('ref');
function ref() {
  return _ref;
}

export {
  type Actor,
  System,

  ref,
  update
}