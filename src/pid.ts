import type { Actor } from './main.js';

declare const actorSym: unique symbol;

type PID<A extends Actor> = Uint8Array & {
  actor: A;
  [actorSym]: true;
}

const P = 'p'.charCodeAt(0);
const I = 'i'.charCodeAt(0);
const D = 'd'.charCodeAt(0);
const LENGTH = 5;

function isPID(item: unknown): item is PID<Actor> {
  if(!ArrayBuffer.isView(item) || !(item instanceof Uint8Array)) return false;
  if(item.byteLength !== LENGTH) return false;
  return item[0] === P && item[1] === I && item[2] === D;
}

function createPID(i: number, actor: Actor): PID<typeof actor> {
  let arr = new Uint8Array(LENGTH);
  arr[0] = P;
  arr[1] = I;
  arr[2] = D;
  arr[3] = i;
  return arr as PID<typeof actor>;
}

function systemIndex(pid: PID<any>) {
  return pid[3];
}

export {
  type PID,
  isPID,
  createPID,
  systemIndex
};