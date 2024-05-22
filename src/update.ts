import type { DOMActor } from './main.js';
import { render } from './render.js';
import { type Process } from './pid.js';
import { getActorFromPID } from './system.js';

const _root = Symbol.for('root');
function link(pid: Process<any>, el: Element | Comment) {
  (getActorFromPID(pid) as any)[_root] = el;
}

function update(actor: DOMActor) {
  let root = (actor as any)[_root];
  if(root != null) {
    let tree = actor.view();
    let newRoot = render(tree, root, actor);
    if(root !== newRoot) {
      (actor as any)[_root] = newRoot;
    }
  }
}

export {
  link,
  update,
  _root
}