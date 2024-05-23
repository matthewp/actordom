import type { Actor } from './main.js';
import { systemId } from './system.js';

export let isNode = typeof self === 'undefined';

declare const actorSym: unique symbol;

let prefix = '~ad~' as const;

type Process<A extends Actor> = `${typeof prefix}${string}/${string}` & {
  actor: A;
}

const LENGTH = 78;

function isPID(item: unknown): item is Process<Actor> {
  if(typeof item !== 'string') return false;
  return item.length === LENGTH && item.startsWith('~ad~');
}

function getSystem(pid: Process<Actor>): string {
  return pid.slice(5, 41);
}

function getId(pid: Process<Actor>): string {
  return  pid.slice(42);
}

function createFromParts(systemId: string, id: string): Process<Actor> {
  return `${prefix}/${systemId}/${id}` as Process<Actor>;
}

function createPID(): Process<Actor> {
  return createFromParts(systemId, crypto.randomUUID());
}

function createPIDForSystem(system: string) {
  return createFromParts(system, crypto.randomUUID());
}

export {
  type Process,

  createPID,
  isPID,
  getSystem,
  getId,
  createPIDForSystem
};