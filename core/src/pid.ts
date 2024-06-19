import type { Actor } from './main.js';
import { systemId } from './system.js';

let prefix = '~ad~' as const;

type UUID = `${string}-${string}-${string}-${string}-${string}`;
type ProcessID = `${typeof prefix}/${UUID}/${UUID}`;

type Process<A extends Actor> = {
  i: ProcessID;
  /** @interal */
  actor: A;
  new(): void;
}

const LENGTH = 78;

function isPIDString(item: string) {
  return item.length === LENGTH && item.startsWith('~ad~');
}

function isPID(item: unknown): item is Process<Actor> {
  if(typeof (item as any)?.i !== 'string') return false;
  return isPIDString((item as any).i);
}

function getSystem(pid: Process<Actor>): UUID {
  return pid.i.slice(5, 41) as UUID;
}

function getId(pid: Process<Actor>): UUID {
  return  pid.i.slice(42) as UUID;
}

function createFromProcessID<A extends Actor = Actor>(p: ProcessID): Process<A> {
  return { i: p } as Process<A>;
}

function createFromParts(systemId: UUID, id: string): Process<Actor> {
  return { i: `${prefix}/${systemId}/${id}` } as Process<Actor>;
}

function createPID(): Process<Actor> {
  return createFromParts(systemId, crypto.randomUUID());
}

function createPIDForSystem(system: UUID) {
  return createFromParts(system, crypto.randomUUID());
}

export {
  type Process,
  type ProcessID,

  createPID,
  isPID,
  getSystem,
  getId,
  createPIDForSystem,
  createFromProcessID,
  UUID
};