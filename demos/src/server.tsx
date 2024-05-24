import type { Offthread } from './worker';
import { register, spawn, Process, send, sse } from '../../src/node';
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

        <p>this is running on the server</p>
        {this.counter}

        <p>clicking this sends a message from the server to a worker</p>
        <button onClick="increment-worker">Increment worker</button>
      </div>
    )
  }
}

export default register(ServerActor, 'ServerActor');

export {
  sse
}