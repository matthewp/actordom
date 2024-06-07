import type { Actor, DOMActor, Message, MessageName } from './actor.js';
import type { Postable } from './connection.js';
import type { UUID, Process } from './pid.js';

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

type RequestMessage = {
  type: 'request',
  pid: Process<Actor>;
  message: Message<Actor>;
  sender: Process<Actor>;
  replyTo: MessageName<Actor>;
}

type UpdateMessage = {
  type: 'update';
  pid: Process<DOMActor>;
  renderPid: Process<Actor>;
  slotPid: Process<DOMActor> | undefined;
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

type ConnectionMessage = RequestMessage | SpawnMessage | SendMessage | UpdateMessage | NewSystemMessage | SystemMessage | AliasMessage;

function sendMessage(port: Postable, message: ConnectionMessage, transfer?: Transferable[]) {
  port.postMessage(message, transfer);
}

export {
  type SpawnMessage,
  type SendMessage,
  type UpdateMessage,
  type NewSystemMessage,
  type SystemMessage,
  type ConnectionMessage,

  sendMessage
}