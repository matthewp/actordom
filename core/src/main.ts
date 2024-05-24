import type {
  Actor,
  ActorType,
  DOMActor,
  MessageName,
} from './actor.js';
import type { Process } from './pid.js';
import { update, pass } from './update.js';
import { process, send, spawn } from './system.js';
import { connect } from './connection.js';

export {
  type Actor,
  type ActorType,
  type DOMActor,
  type MessageName,
  type Process,

  connect,
  pass,
  process,
  send,
  spawn,
  update
};