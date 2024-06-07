import type { WorkerRouter } from './worker';
import type { AppRouter } from './server';
import { spawn, update, createServerConnection, createWorkerConnection, Request, request, send } from 'actordom';
import { mount } from 'actordom/dom';
import { TodoList } from './todolist';
import Counter from './counter';

let worker = new Worker(new URL('./worker.js', import.meta.url), {
  type: 'module'
});

const { Offthread } = createWorkerConnection<WorkerRouter>(worker);
const { ServerActor } = createServerConnection<AppRouter>('/_actordom');

type FooRequest = Request<{ foo: string }, { bar: string }>;

type namerMailbox = 
  ['first', { target: HTMLInputElement }] |
  ['last', { target: HTMLInputElement }] |
  ['other', FooRequest]

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
      case 'other': {
        debugger;
        data.reply({ bar: 'qux' });
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
  root = document.querySelector('#app')!;
  //counter = spawn(Counter, 'Main thread counter');
  namer = spawn(Namer);
  //todoList = spawn(TodoList);
  //offthreadCounter = spawn(Offthread);
  //server = spawn(ServerActor);
  constructor() {
    //send(this.server, ['worker', this.offthreadCounter]);
    debugger;
    request(this, this.namer, ['other', { foo: 'bar' }], 'one');
  }
  receive([name, data]: ['one', { bar: string }]) {
    update(this);
  }
  view() {
    return (
      <main>
        <h1>My App</h1>
        {this.namer}
      </main>
    );
  }
}

mount(spawn(Main), document.querySelector('#app')!);