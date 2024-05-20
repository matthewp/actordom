import {
  attributes,
  elementOpen,
  elementClose,
  symbols,
  text,
  patch
} 
// @ts-expect-error
from 'incremental-dom';

var eventAttrExp = /^on[a-z]/;
var orphanedHandles: any[] | null = null;
var FN_HANDLE = Symbol('fritz.handle');

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
function addEventCallback(actor: any, message: any, eventName: string) {
  if(eventName in actor) {
    return actor[eventName];
  }
  let handler = (ev: any) => {
    actor.receive([message, ev]);
  };
  actor[eventName] = handler;
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
      if(n[EVENTS]) {
        var k;
        for(var j = 0, jlen = n[EVENTS].length; j < jlen; j++) {
          k = n[EVENTS][j];
          let handler = addEventCallback(actor, k[2], k[1]);
          n[ATTRS].push(k[1], [k[2], handler]);
        }
      }

        var openArgs = [n[TAG], n[ID], null].concat(n[ATTRS]);
        elementOpen.apply(null, openArgs as any);
        break;
      case 2:
        elementClose(n[1]);
        break;
      case 4:
        text(n[1]);
        break;
      case 5:
        
        break;
    }
  }
}

function render(vdom: any, root: any, pid: any): number[] {
  orphanedHandles = [];
  patch(root, () => inner(vdom, pid));
  let out = orphanedHandles;
  orphanedHandles = null;
  return out;
}

export { render };