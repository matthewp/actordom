import { register, handler, setSender, process, spawn } from '../../src/server';
import Counter from './counter.js';

class ServerActor {
  counter = spawn(Counter, 'Server counter');
  receive(){}
  view() {
    console.log('server view', process(this), this.counter);
    return (
      <div class="server-actor">
        <h2>Server actor</h2>
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