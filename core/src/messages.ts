import type { Actor, ViewActor, Message } from './actor.js';
import type { Postable } from './connection.js';
import type { UUID, Process } from './pid.js';
import type { RenderActor } from './render.js';

type SpawnMessage = {
  type: 'spawn';
  name: string;
  pid: Process<Actor>;
  args: any[];
};

type SendMessage = {
  type: 'send';
  pid: Process<Actor>;
  message: Message<Actor>;
};

type UpdateMessage = {
  type: 'update';
  pid: Process<ViewActor>;
  renderPid: Process<RenderActor>;
  slotPid: Process<ViewActor> | undefined;
};

type NewSystemMessage = {
  type: 'new-system';
  system: UUID;
};

type SystemMessage = {
  type: 'system';
  sender: UUID;
  system: UUID;
};

type AliasMessage = {
  type: 'alias';
  system: UUID;
  alias: UUID;
};

type ExitMessage = {
  type: 'exit';
  pid: Process<Actor>;
}

type ConnectionMessage = SpawnMessage | SendMessage | UpdateMessage | NewSystemMessage |
  SystemMessage | AliasMessage | ExitMessage;

function sendMessage(port: Postable, message: ConnectionMessage, transfer?: Transferable[]) {
  port.postMessage(message, { transfer });
}

export {
  type SpawnMessage,
  type SendMessage,
  type UpdateMessage,
  type NewSystemMessage,
  type SystemMessage,
  type ConnectionMessage,
  type ExitMessage,

  sendMessage
}