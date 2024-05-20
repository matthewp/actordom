import { System, ref, update } from '../../src/main';

class Counter {
  root: Element | null = null;
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
        <h1>Counter</h1>
        <div>Count: {this.count}</div>
        <button type="button" onClick="increment">Increment</button>
      </div>
    );
  }
}

class Main {
  root: Element | null = null;
  counter = system.spawn(Counter);
  counterRef = ref();
  receive([name, data]: ['render', Element]) {
    switch(name) {
      case 'render': {
        this.root = data;
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
      </main>
    );
  }
}

let system = new System();
let pid = system.spawn(Main);

let appEl = document.querySelector('#app')!;
system.send(pid, ['render', appEl]);