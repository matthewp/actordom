import type {
  Actor,
  ActorType,
  DOMActor,
  MessageName,
} from './actor.js';
import type { Process } from './pid.js';
import { update } from './update.js';
import { process, send, spawn } from './system.js';
import { connect } from './connection.js';
import { fromRoot } from './render.js';

export {
  type Actor,
  type ActorType,
  type DOMActor,
  type MessageName,
  type Process,

  connect,
  fromRoot,
  process,
  send,
  spawn,
  update
};