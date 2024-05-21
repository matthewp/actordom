import type { DOMActor } from './main.js';
import { render } from './render.js';
import { type PID } from './pid.js';
import { getActorFromPID, _pid } from './system.js';

const _root = Symbol.for('root');
function link(pid: PID<any>, el: Element) {
  (getActorFromPID(pid) as any)[_root] = el;
}

function update(actor: DOMActor) {
  let root = (actor as any)[_root];
  if(root != null) {
    let tree = actor.view();
    render(tree, root, actor);
  }
}

function mount(pid: PID<DOMActor>, el: Element) {
  let actor = getActorFromPID(pid);
  link(pid, el);
  update(actor as any);
}

export {
  link,
  mount,
  update
}