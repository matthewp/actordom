import type {
  Actor,
  ActorType,
  ViewActor,
  MessageName,
  ActorWithMessage,
  ProcessWithMessage,
} from './actor.js';
import type { Process } from './pid.js';
import { update } from './update.js';
import { process, send, spawn } from './system.js';
import { createServerConnection, createWorkerConnection } from './connection.js';

export {
  type Actor,
  type ActorType,
  type ActorWithMessage,
  type ViewActor,
  type MessageName,
  type Process,
  type ProcessWithMessage,

  createServerConnection,
  createWorkerConnection,
  process,
  send,
  spawn,
  update
};