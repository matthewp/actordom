import { Process, mount, process, send, spawn, update, root } from '../../src/main';
import { TodoList } from './todolist';

type counterMailbox = ['increment', Event]

class Counter {
  count = 0;
  receive([name, data]: counterMailbox) {
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
        <h2>Counter</h2>
        <div>Count: {this.count}</div>
        <button type="button" onClick="increment">Increment</button>
      </div>
    );
  }
}

type namerMailbox = 
  ['first', { target: HTMLInputElement }] |
  ['last', { target: HTMLInputElement }];

class Namer {
  first = '';
  last = '';
  receive([name, data]: namerMailbox) {
    switch(name) {
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
  [root] = document.querySelector('#app')!;
  counter = spawn(Counter);
  namer = spawn(Namer);
  todoList = spawn(TodoList);
  constructor() {
    update(this);
  }
  receive() {}
  view() {
    return (
      <main>
        <h1>App</h1>
        {this.counter}
        {this.namer}
        {this.todoList}
      </main>
    );
  }
}

spawn(Main);