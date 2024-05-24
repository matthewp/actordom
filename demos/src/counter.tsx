import { update, process } from 'actordom';

type counterMailbox = ['increment', Event]

class Counter {
  count = 0;
  constructor(public title: string) {}
  receive([name]: counterMailbox) {
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
        <h2>{this.title}</h2>
        <div>Count: {this.count}</div>
        <button type="button" onMouseDown="increment">Increment</button>
      </div>
    );
  }
}

export default Counter;