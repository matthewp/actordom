import type { AnyRouter } from './remote.js';
import { mount } from './render.js';
import { spawn } from './system.js';

function checkForActor(router: AnyRouter, el: HTMLElement) {
  let actorName = el.dataset.actor;
  if(actorName) {
    let ActorType = router['_routes'][actorName];
    if(ActorType) {
      let args = JSON.parse(el.dataset.args!) as string;
      spawn(ActorType, ...args);
    }
  }
}

function listenForIslands(router: AnyRouter) {
  let checkForActors = (nodes: NodeList) => {
    nodes.forEach(node => {
      if(node.nodeType === 1) {
        checkForActor(router, node as HTMLElement);
      }
    });
  };
  let mo = new MutationObserver(mutations => {
    for(let mutation of mutations) {
      switch(mutation.type) {
        case 'attributes':
        case 'childList': {
          checkForActors(mutation.addedNodes);
          break;
        }
      }
      mutation.type
      mutation.addedNodes
    }
  });
  mo.observe(document.body, {
    attributes: true,
    childList: true,
    subtree: true
  });

  checkForActors(document.querySelectorAll('[data-actor]'));

  return () => mo.disconnect();
}


export {
  listenForIslands,
  mount
}
