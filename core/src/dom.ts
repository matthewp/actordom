import type { ViewActorType } from './actor.js';
import { isPlainFunction } from './common.js';
import type { ViewRouter } from './remote.js';
import { mount } from './render.js';
import { spawn } from './system.js';

function mountOnto(Actor: ViewActorType, args: any[], el: HTMLElement) {
  let pid = spawn(Actor, ...args);
  mount(pid, el);
}
function checkForActor(router: ViewRouter, el: HTMLElement) {
  let actorName = el.dataset.actor;
  if(actorName) {
    let ActorType = router['routes'][actorName];
    if(ActorType) {
      let args = JSON.parse(el.dataset.args!) as string[];
      if(isPlainFunction(ActorType)) {
        ActorType().then(ActorType => mountOnto(ActorType, args, el));
        return;
      }
      mountOnto(ActorType, args, el);
    }
  }
}


function checkForActors(router: ViewRouter, nodes: NodeList) {
  nodes.forEach(node => {
    if(node.nodeType === 1) {
      checkForActor(router, node as HTMLElement);
    }
  });
}

function spawnIslands(router: ViewRouter, root = document.documentElement) {
  checkForActors(router, root.querySelectorAll('[data-actor]'));
}

function listenForIslands(router: ViewRouter, root = document.documentElement) {
  let mo = new MutationObserver(mutations => {
    for(let mutation of mutations) {
      switch(mutation.type) {
        case 'attributes':
        case 'childList': {
          checkForActors(router, mutation.addedNodes);
          break;
        }
      }
      mutation.type
      mutation.addedNodes
    }
  });
  mo.observe(root, {
    attributes: true,
    childList: true,
    subtree: true
  });

  spawnIslands(router, root);

  return () => mo.disconnect();
}


export {
  listenForIslands,
  mount,
  spawnIslands,
}
