import type { Actor } from './main.js';
import { systemId } from './system.js';

let isNode = typeof self === 'undefined';

declare const actorSym: unique symbol;

type Process<A extends Actor> = Uint8Array & {
  actor: A;
  [actorSym]: true;
}

const P = 112; // p
const I = 105; // i
const D = 100; // d
const LENGTH = 7;

function isPID(item: unknown): item is Process<Actor> {
  if(!ArrayBuffer.isView(item) || !(item instanceof Uint8Array)) return false;
  if(item.byteLength !== LENGTH) return false;
  return item[0] === P && item[1] === I && item[2] === D;
}

function createPID(i: number) {
  let buffer: ArrayBuffer;
  // TODO refactor into external function
  if(isNode) {
    buffer = new ArrayBuffer(LENGTH);
  } else if(!self.crossOriginIsolated) {
    throw new Error('actor-dom requires SharedArrayBuffer');
  } else {
    buffer = new SharedArrayBuffer(LENGTH);
  }
  let arr = new Uint8Array(buffer);
  arr[0] = P;
  arr[1] = I;
  arr[2] = D;
  arr[3] = systemId;
  arr[4] = i;
  return arr;
}

function systemIndex(pid: Process<any>) {
  return pid[4];
}

export {
  type Process,
  isPID,
  createPID,
  systemIndex
};