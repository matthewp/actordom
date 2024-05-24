import type { Actor, DOMActor } from './actor.js';
import { type Process, getSystem } from './pid.js';
import { sendMessage } from './messages.js';
import { getActorFromPID, getMessenger, inThisSystem, process, send } from './system.js';

const _root = Symbol.for('root');
const _renderPid = Symbol.for('renderPid');

function update(actor: DOMActor, root?: Process<Actor>) {
  let pid = process(actor);
  if(!root) {
    if(actor[_renderPid]) {
      root = actor[_renderPid];
    } else {
      return;
    }
  }

  let tree = actor.view();
  send(root!, ['', [pid, tree]]);
}

function updateProcess(pid: Process<DOMActor>, renderPid: Process<Actor>) {
  if(inThisSystem(pid)) {
    let actor = getActorFromPID(pid);
    if(actor) {
      if(!(_renderPid in actor)) {
        actor[_renderPid] = renderPid;
      }

      update(actor);
    }
  } else {
    let system = getSystem(pid);
    let port = getMessenger(system);
    if(port == null) {
      throw new Error(`Could not find message port for system: ${system}`)
    }
    sendMessage(port, {
      type: 'update',
      pid,
      renderPid,
    });
  }
}

export {
  update,
  updateProcess,
  _root,
  _renderPid
}