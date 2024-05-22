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
import type { DOMActor, Process } from './main.js';
import type { Tree } from './tree.js';
import type { JSXInternal } from './jsx.js';

import { updateProcess, _root } from './update.js';
import { spawn, send, inThisSystem } from './system.js';

var eventAttrExp = /^on[a-z]/;

var attributesSet = attributes[symbols.default];
attributes[symbols.default] = preferProps;

function preferProps(element: any, name: string, value: any){
  if(isEventProperty(name, value)) {
    element[name] = value[1];
  } else if(name in element && !isSVG(element)) {
    element[name] = value;
  }
  else
    attributesSet(element, name, value);
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

const TAG = 1;
const ID = 2;
const ATTRS = 3;
const EVENTS = 4;

function inner(bc: any, actor: any){
  var n;
  for(var i = 0, len = bc.length; i < len; i++) {
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
            addEventCallback(actor, currentElement(), k[2], k[1])
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
        } else {
          let el = currentElement();
          let start = document.createComment('ad-start');
          let render = document.createComment('ad-render');
          let end = document.createComment('ad-end');
          el.insertBefore(end, pointer);
          el.insertBefore(render, end);
          el.insertBefore(start, render);
          skipNode();
          skipNode();
          skipNode();
  
          link(n[1], render);

          if(!n[1][6]) {
            n[1][6] = 1;
            updateProcess(n[1]);
          }
        }
        break;
      }
    }
  }
}

const _outer = Symbol.for('outer');
function render(vdom: Tree | JSXInternal.Element, root: Element, pid: Process<DOMActor>) {
  let patcher = patch;
  let isPlaceholder = root.nodeType === 8;
  if(isPlaceholder || (root as any)[_outer]) {
    patcher = patchOuter;
  }
  let ret = patcher(root, () => inner(vdom, pid));
  if(isPlaceholder) {
    ret[_outer] = true;
  }
  return ret;
}

function link(pid: Process<any>, el: Element | Comment) {
  pid[5] = fromRoot(el as any)[4];
  //(getActorFromPID(pid) as any)[_root] = ;
}

class RenderActor {
  constructor(public root: Element) {}
  receive([, [pid, tree]]: [string, [Process<DOMActor>, Tree]]) {
    let newRoot = render(tree, this.root, pid);
    if(this.root !== newRoot) {
      this.root = newRoot;
    }
  }
}

function fromRoot(root: Element) {
  return spawn(RenderActor, root);
}

export { render, fromRoot };