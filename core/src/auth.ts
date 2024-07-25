import type { Actor, ActorType, ActorWithMessage, ProcessWithMessage } from './actor.js';
import type { Process } from './pid.js';
import { process, send, spawn } from './system.js';
import { getRequest } from './node.js';
import type { Tail } from './common.js';

class PopableMap<T> extends Map<string, T> {
  add(ref: string, value: T) {
    this.set(ref, value);
  }
  pop(ref: string): T {
    let value = this.get(ref)!;
    this.delete(ref);
    return value;
  }
}

interface ActorTypeWithAuthConstructor<U> {
  new(user: U, ...args: any[]): Actor;
}

type MinRequest<U> = {
  ref: string;
  url: string;
  headers: Record<string, string>;
  cookies: string;
  sender: ProcessWithMessage<AuthResponse<U>>;
};

type AuthMailbox<U> = ['check', MinRequest<U>];
type AuthResponse<U> = ['logged-in', {
  ref: string,
  data: U
}] | ['logged-out', { ref: string }];

type RelayableMessage = [string, {
  sender: ProcessWithMessage<['unauthorized', true]>;
}]
type relayMailbox = ['incoming', RelayableMessage] |
  AuthResponse<any>;

class AuthRelay {
  auth: Process<ActorWithMessage<AuthMailbox<any>>>;
  TargetActor: ActorType;
  target: Process<Actor> | null = null;
  args: any[];
  // Should probably be an LRU
  reqs = new PopableMap<RelayableMessage>();
  constructor(auth: ActorType, target: ActorType, args: any[]) {
    this.auth = spawn(auth);
    this.TargetActor = target;
    this.args = args;
  }

  receive([name, data]: relayMailbox) {
    switch(name) {
      case 'incoming': {
        let req = getRequest();
        if(req) {
          let ref = crypto.randomUUID();
          this.reqs.add(ref, data);
          send(this.auth, 'check', {
            ref,
            url: req.url!,
            headers: req.headers as any,
            cookies: req.headers['cookie'] ?? '',
            sender: process(this)
          });
        }
        break;
      }
      case 'logged-in': {
        let message = this.reqs.pop(data.ref);
        if(this.target === null) {
          this.target = spawn(this.TargetActor, data.data, ...this.args);
        }
        send(this.target, message[0], message[1]);
        break;
      }
      case 'logged-out': {
        let req = this.reqs.pop(data.ref);
        send(req[1].sender, 'unauthorized', true);
        break;
      }
    }
  }
}

function requestHandler<U>(AuthActor: ActorType, TargetActor: ActorTypeWithAuthConstructor<U>) {
  return class {
    relay: Process<AuthRelay>;
    constructor(...args: any[]) {
      this.relay = spawn(AuthRelay, AuthActor, TargetActor, args);
    }
    receive(message: [string, any]) {
      send(this.relay, 'incoming', message);
    }
  }
}

type AuthRoutes<
  U,
  R extends Record<string, ActorTypeWithAuthConstructor<U>>
> = {
  [K in keyof R]: R[K] & {
    new(...args: Tail<ConstructorParameters<R[K]>>): InstanceType<R[K]>;
  };
};

function createAuthRelay<U>(AuthActor: ActorType) {
  return function relay<
    const R extends Record<string, ActorTypeWithAuthConstructor<U>> = Record<string, ActorTypeWithAuthConstructor<U>>
    >(routes: R): AuthRoutes<U, R> {
    const out = {} as any;
    for(let [name, RelayingActor] of Object.entries(routes)) {
      (out as any)[name] = requestHandler(AuthActor, RelayingActor);
    }

    return out;
  };
}

export {
  type AuthMailbox,
  createAuthRelay
};
