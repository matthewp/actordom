import type { Actor, DOMActor } from './actor.js';
import { type Process, createPID } from './pid.js';
import { getActorFromPID, getSystem, inThisSystem, process, send } from './system.js';

const _root = Symbol.for('root');

function update(actor: DOMActor, root?: Process<Actor>) {
  // TODO maybe a little slow, optimize later
  let pid = process(actor);
  if(!root) {
    if(pid[5]) {
      root = createPID(pid[5]) as Process<Actor>;
      root[3] = 0;
    } else {
      return;
    }
  }

  let tree = actor.view();
  send(root!, ['', [pid, tree]]);
}

function updateProcess(pid: Process<Actor>) {
  if(inThisSystem(pid)) {
    let actor = getActorFromPID(pid);
    if(actor) {
      update(actor as DOMActor);
    }
  } else {
    getSystem(pid[3])?.postMessage({
      type: 'update',
      pid: pid.buffer,
    });
  }
}

export {
  update,
  updateProcess,
  _root
}