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

if(isNode) {
  (ArrayBuffer as any).prototype.toJSON = function() {
    return Array.from(new Uint8Array(this));
  };
  (Uint8Array as any).prototype.toJSON = function() {
    return Array.from(this);
  };
}

if(!isNode && !self.crossOriginIsolated) {
  throw new Error('actor-dom requires SharedArrayBuffer')
}

const ArrayBufferToUse = (isNode ? ArrayBuffer : SharedArrayBuffer) as typeof ArrayBuffer;

function createPID(i: number) {
  let buffer = new ArrayBufferToUse(LENGTH);
  let arr = new Uint8Array(buffer);
  arr[0] = P;
  arr[1] = I;
  arr[2] = D;
  arr[3] = systemId;
  arr[4] = i;
  //console.log("S", JSON.stringify(arr))
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