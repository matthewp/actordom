import {
  attributes,
  currentPointer,
  currentElement,
  elementOpen,
  elementClose,
  skipNode,
  symbols,
  text,
  patch,
  patchOuter
} 
// @ts-expect-error
from 'incremental-dom';
import type { Actor } from './actor.js';
import type { ViewActor, Process } from './main.js';
import type { Tree } from './tree.js';
import type { JSXInternal } from '../types/jsx.js';

import { updateProcess, _renderPid, _root, update } from './update.js';
import { spawn, send, inThisSystem } from './system.js';
import { isPID } from './pid.js';

var eventAttrExp = /^on[a-z]/;

var attributesSet = attributes[symbols.default];
attributes[symbols.default] = preferProps;

function preferProps(element: any, name: string, value: any){
  if(isEventProperty(name, value)) {
    element[name] = value[1];
  } else if(name in element && !isSVG(element)) {
    element[name] = value;
  } else if(typeof value === 'boolean') {
    if(value) {
      element.setAttribute(name, '');
    } else {
      element.removeAttribute(name);
    }
  } else {
    attributesSet(element, name, value);
  }
}

function isEventProperty(name: string, value: any) {
  return eventAttrExp.test(name) && Array.isArray(value) && typeof value[1] === 'function';
}

function isSVG(element: Element) {
  return element.namespaceURI === 'http://www.w3.org/2000/svg';
}

// TODO clean this all up
// TODO PIDs should be what is passed around.
function addEventCallback(pid: any, element: Element, message: any, eventName: string) {
  if((element as any)[eventName]) {
    return (element as any)[eventName];
  }
  let handler = function(ev: Event) {
    if(inThisSystem(pid)) {
      send(pid, [message, ev]);
    } else {
      ev.preventDefault();
      send(pid, [message, {
        type: ev.type,
        currentTarget: {
          value: (ev as any).currentTarget?.value
        }
      }]);
    }
  };
  (element as any)[eventName] = handler;
  return handler;
}

let _update = '~ad.update~';

const TAG = 1;
const ID = 2;
const ATTRS = 3;
const EVENTS = 4;

function inner(root: Element | Range, bc: any, actor: RenderActor, pid: Process<ViewActor>) {
  let isRange = root instanceof Range;
  if(isRange) {
    // Skip until we find the start comment.
    while(true) {
      let p = currentPointer();
      if(p === (root as Range).startContainer) {
        skipNode();
        break;
      }
      skipNode();
    }
  }

  var n;
  for(var i = 1, len = bc.length; i < len; i++) {
    n = bc[i];
    switch(n[0]) {
      // Open
      case 1:
        var openArgs = [n[TAG], n[ID], null].concat(n[ATTRS]);
        elementOpen.apply(null, openArgs as any);

        if(n[EVENTS]) {
          var k: [number, string, string];
          for(var j = 0, jlen = n[EVENTS].length; j < jlen; j++) {
            k = n[EVENTS][j];
            addEventCallback(pid, currentElement(), k[2], k[1])
          }
        }


        break;
      case 2:
        elementClose(n[1]);
        break;
      case 4:
        text(n[1]);
        break;
      case 5: {
        let pointer = currentPointer();
        if(pointer?.nodeType === 8 && pointer?.data === 'ad-start') {
          do {
            skipNode();
            pointer = currentPointer();
          } while(pointer?.data !== 'ad-end');
          skipNode();

          if(n[2]) {
            let slotPid = actor.cMap.get(n[1])!;
            send(slotPid, [_update, n[2]]);
          }
        } else {
          let el = currentElement();
          let start = document.createComment('ad-start');
          let end = document.createComment('ad-end');
          el.insertBefore(end, pointer);
          el.insertBefore(start, end);
          skipNode();
          skipNode();

          let range = document.createRange();
          range.setStart(start, 0);
          range.setEnd(end, 0);
  
          let renderPid = fromRoot(range);
          actor.pidMap.set(n[1], renderPid);

          let slotPid: Process<ViewActor> | undefined = undefined;
          if(n[2]) {
            slotPid = spawn(Children, pid, n[2]);
            actor.cMap.set(n[1], slotPid);
          }

          // TODO probably not needed. I think we only every get here once.
          if(!actor.mounted.has(n[1])) {
            actor.mounted.add(n[1]);
            updateProcess(n[1], renderPid, slotPid);
          }
        }
        break;
      }
    }
  }

  if(isRange) {
    // Skip past the end container
    let p = currentPointer();
    if(p === (root as Range).endContainer) {
      do {
        skipNode();
        p = currentPointer();
      } while(p);
    }
  }
}

let queue: [vdom: Tree | JSXInternal.Element, root: Element | Range, actor: RenderActor, pid: Process<ViewActor>][] = [];
function render() {
  let [vdom, root, actor, pid] = queue[0];
  let realRoot = root;
  if(root instanceof Range) {
    root = (root as Range).startContainer.parentNode as any;
  }
  patch(root, () => inner(realRoot, vdom, actor, pid));
  // remove the first item
  queue.shift();
}

function enqueue(vdom: Tree | JSXInternal.Element, root: Element | Range, actor: RenderActor, pid: Process<ViewActor>) {
  queue.push([vdom, root, actor, pid]);
  if(queue.length === 1) {
    do {
      render();
    } while(queue.length);
  }
}

class Children {
  constructor(public pid: Process<ViewActor>, public tree: Tree){}
  receive(message: [typeof _update, Tree] | [string, any]) {
    if(message[0] === _update) {
      this.tree = message[1];
      update(this);
    } else {
      send(this.pid, message);
    }
  }
  view() { return this.tree as any; }
}

class RenderActor {
  pidMap = new Map<string, Process<Actor>>;
  cMap = new Map<Process<ViewActor>, Process<ViewActor>>;
  mounted = new Set<string>;
  constructor(public root: Element | Range) {}
  receive([, [pid, tree]]: [string, [Process<ViewActor>, Tree]]) {
    enqueue(tree, this.root, this, pid);
  }
}

function fromRoot(root: Element | Range) {
  return spawn(RenderActor, root);
}

function mount(actorOrProcess: ViewActor | Process<ViewActor>, root: Element) {
  if(isPID(actorOrProcess)) {
    updateProcess(actorOrProcess, fromRoot(root), undefined);
  } else {
    actorOrProcess[_renderPid] = fromRoot(root);
    update(actorOrProcess);
  }
}

export { mount, fromRoot };