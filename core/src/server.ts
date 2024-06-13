import type {
  Actor,
  ActorType,
  ViewActor,
  MessageName,
} from './actor.js';
import { type ConnectionMessage, sendMessage } from './messages.js';
import type { Process, UUID } from './pid.js';
import type { Tree } from './tree.js';
import type { JSX } from 'actordom/jsx-runtime';
import { type AnyRouter, router } from './remote.js';
import { process, send, spawn, addSelfAlias, updateSystem, systemId, removeSystemAlias, inThisSystem, getActorFromPID } from './system.js';
import { update } from './update.js';

type OverTheWireConnectionMessage = ConnectionMessage & { requestId: UUID; };
type MessageHandler = (message: OverTheWireConnectionMessage) => void;

class AsyncTracker {
  count = 0;
  isDone = false;
  constructor(public onDone: () => any) {}
  wait() {
    this.count++;
  }
  entered() {
    if(!this.isDone && this.count === 0) {
      this.#finalize();
    }
  }
  done = () => {
    this.count--;
    if(this.count === 0) {
      this.#finalize();
    }
  };
  #finalize() {
    this.isDone = true;
    let onDone = this.onDone;
    this.onDone = () => {};
    onDone();
  }
}

type OnServerMessage = (id: UUID) => () => void;

function serverSide(onMessage: MessageHandler, router: AnyRouter, port: MessagePort, onServerMessage: OnServerMessage) {
  port.onmessage = (ev: MessageEvent<OverTheWireConnectionMessage>) => {
    let onDone = onServerMessage(ev.data.requestId);
    switch(ev.data.type) {
      case 'new-system': {
        let channel = new MessageChannel();
        updateSystem(ev.data.system, channel.port1);
        serverSide(onMessage, router, channel.port1, onServerMessage);
        clientSide(onMessage, channel.port2);
        break;
      }
      default: {
        router(ev.data);
        break;
      }
    }
    onDone();
  };
  port.start();
}

function clientSide(onMessage: MessageHandler, port: MessagePort) {
  port.onmessage = (ev: MessageEvent<OverTheWireConnectionMessage>) => {
    onMessage(ev.data);
  };
  port.start();
}

type BrowserEvent = { data: OverTheWireConnectionMessage };

function createBrowserConnection(router: AnyRouter, onMessage: MessageHandler, onServerMessage: OnServerMessage) {
  let channel: MessageChannel;
  let alias: UUID;
  return {
    handle(ev: BrowserEvent, tracker: AsyncTracker, requestId: UUID) {
      ev.data.requestId = requestId;
      switch(ev.data.type) {
        case 'system': {
          alias = ev.data.system;
          addSelfAlias(alias);
          channel = new MessageChannel();
          updateSystem(ev.data.sender, channel.port1);
          serverSide(onMessage, router, channel.port1, onServerMessage);
          clientSide(onMessage, channel.port2);
  
          // Tell the sender your real systemId.
          sendMessage(channel.port1, { type: 'alias', system: ev.data.system, alias: systemId });
          break;
        }
        default: {
          tracker.wait();
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
      case 5: {
        let pid = instruction[1];
        if(inThisSystem(pid)) {
          let actor = getActorFromPID(pid) as ViewActor;
          let dom = actor.view();
          let html = renderToString(dom);
          builder += html;
        } else {
          // TODO what do?
        }
        break;
      }
    }
  }
  return builder;
}

export {
  type Actor,
  type ActorType,
  type ViewActor,
  type MessageName,
  type Process,
  type OverTheWireConnectionMessage,

  AsyncTracker,
  createBrowserConnection,
  renderToString,
  router,
  process,
  send,
  spawn,
  update
};
