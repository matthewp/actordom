import type { ActorType } from './actor.js';
import type { ConnectionMessage } from './messages.js';
import { send, spawnWithPid } from './system.js';
import { updateProcess } from './update.js';

function createRemoteHandler(items: Record<string, ActorType>) {
  return function(message: ConnectionMessage) {
    switch(message.type) {
      case 'spawn': {
        let Item = items[message.name];
        spawnWithPid(Item, message.pid, ...message.args); //todo args
        break;
      }
      case 'send': {
        send(message.pid, message.message);
        break;
      }
      case 'update': {
        updateProcess(message.pid, message.renderPid, message.slotPid);
        break;
      }
    }
  };
}

export {
  createRemoteHandler
}