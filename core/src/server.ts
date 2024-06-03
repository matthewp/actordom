import type {
  Actor,
  ActorType,
  DOMActor,
  MessageName,
} from './actor.js';
import { type ConnectionMessage, sendMessage } from './messages.js';
import type { Process, UUID } from './pid.js';
import type { Tree } from './tree.js';
import type { JSX } from 'actordom/jsx-runtime';
import { type AnyRouter, router } from './remote.js';
import { process, send, spawn, addSelfAlias, updateSystem, systemId, removeSystemAlias } from './system.js';
import { update } from './update.js';

type OverTheWireConnectionMessage = ConnectionMessage & { port: UUID; };

type MessageHandler = (message: OverTheWireConnectionMessage) => void;

function serverSide(onMessage: MessageHandler, router: AnyRouter, port: MessagePort) {
  port.onmessage = (ev: MessageEvent<OverTheWireConnectionMessage>) => {
    switch(ev.data.type) {
      case 'new-system': {
        let channel = new MessageChannel();
        updateSystem(ev.data.system, channel.port1);
        serverSide(onMessage, router, channel.port1);
        clientSide(onMessage, channel.port2, ev.data.port);
        break;
      }
      default: {
        router(ev.data);
        break;
      }
    }
  };
  port.start();
}

function clientSide(onMessage: MessageHandler, port: MessagePort, uuid: UUID) {
  port.onmessage = (ev: MessageEvent<OverTheWireConnectionMessage>) => {
    ev.data.port = uuid;
    onMessage(ev.data);
  };
  port.start();
}

function createBrowserConnection(router: AnyRouter, onMessage: MessageHandler) {
  let channel: MessageChannel;
  let alias: UUID;
  return {
    handle(ev: { data: OverTheWireConnectionMessage }) {
      switch(ev.data.type) {
        case 'system': {
          alias = ev.data.system;
          addSelfAlias(alias);
          channel = new MessageChannel();
          updateSystem(ev.data.sender, channel.port1);
          serverSide(onMessage, router, channel.port1);
          clientSide(onMessage, channel.port2, ev.data.port);
  
          // Tell the sender your real systemId.
          sendMessage(channel.port1, { type: 'alias', system: ev.data.system, alias: systemId });
          break;
        }
        default: {
          sendMessage(channel.port2, ev.data);
          break;
        }
      }
    },
    close() {
      channel.port1.close();
      channel.port2.close();
      removeSystemAlias(alias);
    }
  }
}

const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img',
  'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

function renderToString(tree: Tree | JSX.Element): string {
  let builder = '';
  for(let instruction of tree as Tree) {
    switch(instruction[0]) {
      case 1: {
        let tag = instruction[1];
        let attrs = instruction[3];
        builder += `<${tag}`;
        let i = 0;
        while (i < attrs.length) {
          let attrName = attrs[i++];
          let attrValue = attrs[i++];
          builder += ` ${attrName}="${attrValue}"`
        }
        builder += `>`;
        break;
      }
      case 2: {
        let tag = instruction[1];
        if(!voidTags.has(tag)) {
          builder += `</${tag}>`;
        }
        break;
      }
      case 4: {
        let text = instruction[1];
        builder += text;
        break;
      }
    }
  }
  return builder;
}

export {
  type Actor,
  type ActorType,
  type DOMActor,
  type MessageName,
  type Process,
  type OverTheWireConnectionMessage,

  createBrowserConnection,
  renderToString,
  router,
  process,
  send,
  spawn,
  update
};