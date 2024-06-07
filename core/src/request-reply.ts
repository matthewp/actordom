import type { Actor, Message, MessageName } from './actor.js';
import { sendMessage } from './messages.js';
import { getSystem, type Process } from './pid.js';
import { getActorFromPID, getMessenger, inThisSystem, process, send } from './system.js';

type UnknownRequest = Request<unknown, unknown>;
type RequestMessageRaw<A extends Actor> = Extract<Message<A>, [string, UnknownRequest]>;
type RequestMessage<A extends Actor, B extends RequestMessageRaw<A> = RequestMessageRaw<A>> = [B[0], B[1]['body']];

class Request<T extends any, S extends any> {
  /** @private */
  declare response: S;
  constructor(public readonly body: T, public readonly sender: Process<Actor>, public readonly replyTo: MessageName<Actor>) {}
  reply(body: S) {
    send(this.sender, [this.replyTo, body]);
  }
}

function request<A extends Actor, P extends Process<Actor>>(actor: A, pid: P, message: RequestMessage<P['actor']>, replyTo: MessageName<A>) {
  let sender = process(actor);
  if(inThisSystem(pid)) {
    let actor = getActorFromPID(pid);
    if(actor) {
      let requestMessage = new Request(message[1], sender, replyTo);
      actor.receive([message[0], requestMessage]);
    }
  } else {
    let system = getSystem(pid);
    let port = getMessenger(system);
    if(!port) {
      throw new Error(`Unknown port: ${system}`)
    }
    sendMessage(port, {
      type: 'request',
      pid: pid,
      message,
      sender,
      replyTo
    });
  }
}

export {
  type RequestMessage,
  type UnknownRequest,
  type Request,

  request
};