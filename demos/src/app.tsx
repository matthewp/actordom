import { System, ref, update } from '../../src/main';

type counterMailbox = 
  ['increment', Event] |
  ['ref', any];

class Counter {
  root: Element | null = null;
  count = 0;
  receive([name, data]: counterMailbox) {
    switch(name) {
      case 'ref': {
        this.root = data;
        break;
      }
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
        <h2>Counter</h2>
        <div>Count: {this.count}</div>
        <button type="button" onClick="increment">Increment</button>
      </div>
    );
  }
}

type namerMailbox = 
  ['ref', any] |
  ['first', { target: HTMLInputElement }] |
  ['last', { target: HTMLInputElement }];

class Namer {
  root: Element | null = null;
  first = '';
  last = '';
  receive([name, data]: namerMailbox) {
    switch(name) {
      case 'ref': {
        this.root = data;
        break;
      }
      case 'first': {
        this.first = data.target.value;
        break;
      }
      case 'last': {
        this.last = data.target.value;
        break;
      }
    }
    update(this);
  }
  view() {
    return (
      <div>
        <h2>Name</h2>
        <input type="text" onInput="first" placeholder="First"></input>
        <input type="text" onInput="last" placeholder="Last"></input>
        <div>
          Full name: <span>{this.first}</span> <span>{this.last}</span>
        </div>
      </div>
    )
  }
}

class Main {
  root: Element | null = null;
  counter = system.spawn(Counter);
  counterRef = ref();
  namer = system.spawn(Namer);
  namerRef = ref();
  receive([name, data]: ['render', Element]) {
    switch(name) {
      case 'render': {
        this.root = data;
        system.send(this.counter, ['ref', this.counterRef]);
        system.send(this.namer, ['ref', this.namerRef]);
        break;
      }
    }
    update(this);
  }
  view() {
    return (
      <main>
        <h1>App</h1>
        {this.counterRef}
        {this.namerRef}
      </main>
    );
  }
}

let system = new System();
let pid = system.spawn(Main);

let appEl = document.querySelector('#app')!;
system.send(pid, ['render', appEl]);