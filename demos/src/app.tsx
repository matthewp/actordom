import type actors from './worker';
import type serverActors from './server';
import { spawn, update, connect, fromRoot, send } from '../../src/main';
import { TodoList } from './todolist';
import Counter from './counter';

let worker = new Worker(new URL('./worker.js', import.meta.url), {
  type: 'module'
});

let connection = connect<typeof actors>(worker);
const Offthread = connection.expose('Offthread');

let server = connect<typeof serverActors>('/_domactor');
const ServerActor = server.expose('ServerActor');

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
  root = fromRoot(document.querySelector('#app')!);
  counter = spawn(Counter, 'Main thread counter');
  namer = spawn(Namer);
  todoList = spawn(TodoList);
  offthreadCounter = spawn(Offthread);
  server = spawn(ServerActor);
  constructor() {
    send(this.server, ['worker', this.offthreadCounter]);

    // Still hate this :(
    update(this, this.root);
  }
  receive() {}
  view() {
    return (
      <main>
        <h1>My App</h1>
        {this.counter}
        <hr />
        {this.namer}
        <hr />
        {this.todoList}
        <hr />
        {this.offthreadCounter}
        <hr />
        {this.server}
      </main>
    );
  }
}

spawn(Main);