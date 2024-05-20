import type { DOMActor } from './main.js';
import { render } from './render.js';
import { isRef } from './ref.js';

function update(actor: DOMActor) {
  if(actor.root instanceof Element) {
    let tree = actor.view();
    render(tree, actor.root, actor);
  } else if(isRef(actor.root)) {
    if(actor.root.value) {
      let tree = actor.view();
      render(tree, actor.root.value, actor);
    } else {
      actor.root.owner = actor;
    }
  }
}

export {
  update
}