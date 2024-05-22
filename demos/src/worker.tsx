import { register, update } from '../../src/worker';

class Offthread {
  count = 0;
  receive([name]: ['increment', Event]) {
    switch(name) {
      case 'increment': {
        this.count++;
        break;
      }
    }
    update(this);
  }
  view() {
    return (
      <div>
        <h2>Worker Counter</h2>
        <div>Count: {this.count}</div>
        <button type="button" onClick="increment">Increment</button>
      </div>
    )
  }
}

export default register(Offthread, 'Offthread');
