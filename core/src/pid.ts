import type { Actor } from './main.js';
import { systemId } from './system.js';

let prefix = '~ad~' as const;

type UUID = `${string}-${string}-${string}-${string}-${string}`;
type ProcessID = `${typeof prefix}/${UUID}/${UUID}`;

type Process<A extends Actor> = ProcessID & {
  actor: A;
}

const LENGTH = 78;

function isPID(item: unknown): item is Process<Actor> {
  if(typeof item !== 'string') return false;
  return item.length === LENGTH && item.startsWith('~ad~');
}

function getSystem(pid: Process<Actor>): UUID {
  return pid.slice(5, 41) as UUID;
}

function getId(pid: Process<Actor>): UUID {
  return  pid.slice(42) as UUID;
}

function createFromParts(systemId: UUID, id: string): Process<Actor> {
  return `${prefix}/${systemId}/${id}` as Process<Actor>;
}

function createPID(): Process<Actor> {
  return createFromParts(systemId, crypto.randomUUID());
}

function createPIDForSystem(system: UUID) {
  return createFromParts(system, crypto.randomUUID());
}

export {
  type Process,

  createPID,
  isPID,
  getSystem,
  getId,
  createPIDForSystem,
  UUID
};