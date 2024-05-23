import type {
  Actor,
  ActorType,
  DOMActor,
  MessageName,
} from './actor.js';
import type { Process } from './pid.js';
import type { Registry } from './register.js';
import { process, send, spawn, getPIDFromActor, getActorFromPID, incrementPidi, spawnWithPid, setSystemId, updateSystem } from './system.js';
import { update, updateProcess } from './update.js';

const items: any = {};

function serverSide(port: MessagePort) {
  port.onmessage = ev => {
    switch(ev.data.type) {
      case 'spawn': {
        let oldPid = ev.data.pid;
        let newPid = new Uint8Array(oldPid);
        newPid[4] = incrementPidi();
        newPid[5] = oldPid[5];
        newPid[6] = oldPid[6];
        let Item = items[ev.data.name];
        spawnWithPid(Item, newPid as any); //todo args
        port.postMessage({ type: 'new-pid', old: oldPid, new: newPid });
        break;
      }
      case 'send': {
        let pid = new Uint8Array(ev.data.pid);
        send(pid as any, ev.data.message);
        break;
      }
      case 'update': {
        let actor = getActorFromPID(ev.data.pid);
        let realPid = getPIDFromActor(actor!);
        // Not mounted
        if(!realPid[6]) {
          realPid[5] = ev.data.pid[5];
          realPid[6] = ev.data.pid[6];
        }
        
        // PID might have changed, reflect
        updateProcess(realPid as any);
        break;
      }
    }
  };
  port.start();
}

function clientSide(port: MessagePort) {
  port.onmessage = ev => {
    sender(ev.data);
  };
  port.start();
}

// TODO wrong! this is shared by everyone.
let port2: MessagePort;

const handler = (ev: MessageEvent<any>) => {
  switch(ev.data.type) {
    case 'system': {
      setSystemId(ev.data.system);
      let channel = new MessageChannel();
      // TODO all wrong
      updateSystem(0, channel.port1);
      port2 = channel.port2;
      serverSide(channel.port1);
      clientSide(port2);
      break;
    }
    default: {
      port2!.postMessage(ev.data);
      break;
    }
  }
};

function register<A extends ActorType, N extends string>(actor: A, name: N): Registry<N, A> {
  items[name] = actor;
  return {} as any;
}

let sender: any;
function  setSender(_sender: any) {
  sender = _sender;
}

export {
  type Actor,
  type ActorType,
  type DOMActor,
  type MessageName,
  type Process,

  handler,
  setSender,

  register,
  process,
  send,
  spawn,
  update
};