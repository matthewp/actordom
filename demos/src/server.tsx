import type { Offthread } from './worker';
import { register, handler, setSender, process, spawn, Process, Actor, send } from '../../src/server';
import Counter from './counter.js';

type mailbox = ['increment-worker', Event] |
  ['worker', Process<Offthread>];

class ServerActor {
  counter = spawn(Counter, 'Server counter');
  worker: Process<Offthread> | undefined = undefined;
  receive([name, data]: mailbox) {
    switch(name) {
      case 'worker': {
        this.worker = data;
        break;
      }
      case 'increment-worker': {
        if(this.worker) {
          send(this.worker, ['increment', new Event('click')]);
        }
        break;
      }
    }
  }
  view() {
    return (
      <div class="server-actor">
        <h2>Server actor</h2>
        <button onClick="increment-worker">Increment worker</button>

        {this.counter}
      </div>
    )
  }
}

export default register(ServerActor, 'ServerActor');

export {
  handler,
  setSender
};