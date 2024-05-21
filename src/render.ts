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
import { update, link } from './update.js';
import { getActorFromPID } from './system.js';

var eventAttrExp = /^on[a-z]/;
var orphanedHandles: any[] | null = null;

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
function addEventCallback(actor: any, element: Element, message: any, eventName: string) {
  if((element as any)[eventName]) {
    return (element as any)[eventName];
  }
  let handler = function(ev: Event) {
    actor.receive([message, ev]);
  };
  (element as any)[eventName] = handler;
  return handler;
}

const _mounted = Symbol.for('mounted');

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
      case 5:
        let pointer = currentPointer();
        if(pointer) {
          throw new Error('oops');
        }
        // TODO use a comment
        elementOpen('div');
        let el = currentElement();
        n[1].value = el;
        elementClose('div');
        if(n[1].owner) {
          let actor = n[1].owner;
          n[1].owner = null;
          update(actor);
        }
        break;
      case 6: {
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
          if(!n[1][_mounted]) {
            let actor = getActorFromPID(n[1]);
            n[1][_mounted] = true;
            update(actor as any);
          }
        }
        break;
      }
    }
  }
}

const _outer = Symbol.for('outer');
function render(vdom: any, root: any, pid: any) {
  let patcher = patch;
  let isPlaceholder = root.nodeType === 8;
  if(isPlaceholder || root[_outer]) {
    patcher = patchOuter;
  }
  let ret = patcher(root, () => inner(vdom, pid));
  if(isPlaceholder) {
    ret[_outer] = true;
  }
  return ret;
}

export { render };