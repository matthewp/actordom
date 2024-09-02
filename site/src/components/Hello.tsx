import { update } from 'actordom';

class Hello {
  count = 0;
  receive([name, _data]: ['increment', Event]) {
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
        <div>Count: {this.count}</div>
        <button type="button" onClick="increment">Increment</button>
      </div>
    );
  }
}

export default Hello;
