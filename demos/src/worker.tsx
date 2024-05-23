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
        <h2>Worker actor</h2>
        <p>this is running in a web worker</p>
        <div>Count: {this.count}</div>
        <button type="button" onClick="increment">Increment</button>
      </div>
    )
  }
}

export { Offthread };

export default register(Offthread, 'Offthread');
