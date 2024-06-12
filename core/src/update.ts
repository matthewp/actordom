import type { Actor, ViewActor } from './actor.js';
import type { JSXInternal } from '../types/jsx.js';
import { type Process, getSystem } from './pid.js';
import { sendMessage } from './messages.js';
import { getActorFromPID, getMessenger, inThisSystem, process, send } from './system.js';
import { Tree, createTree } from './tree.js';

const _root = Symbol.for('ad.root');
const _renderPid = Symbol.for('ad.render');
const _slotPid = Symbol.for('ad.slot');

// TODO get rid of the second arg, i hate it
function update(actor: ViewActor) {
  render(actor, undefined);
}

function render(actor: ViewActor, slotPid: Process<ViewActor> | undefined) {
  let pid = process(actor);
  let root = actor[_renderPid];
  if(!root) {
    return;
  }
  let tree = slotPid ? actor.view(slotPid) : actor.view();
  send(root!, ['', [pid, tree]]);
}

function updateProcess(pid: Process<ViewActor>, renderPid: Process<Actor>, slotPid: Process<ViewActor> | undefined) {
  if(inThisSystem(pid)) {
    let actor = getActorFromPID(pid);
    if(actor) {
      // TODO This is unnecessary I think
      if(!(_renderPid in actor)) {
        actor[_renderPid] = renderPid;
      }
      if(slotPid !== undefined && !(_slotPid in actor)) {
        actor[_slotPid] = slotPid;
      }

      render(actor, slotPid);
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
      slotPid,
    });
  }
}

export {
  update,
  updateProcess,
  _root,
  _renderPid,
  _slotPid
}