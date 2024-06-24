import type { WorkerRouter } from './worker';
import type { AppRouter } from './server';
import { type Process, spawn, update, createServerConnection, createWorkerConnection, send } from 'actordom';
import { mount } from 'actordom/dom';
import { TodoList } from './todolist';
import Counter from './counter';

let worker = new Worker(new URL('./worker.js', import.meta.url), {
  type: 'module'
});

const { Offthread } = createWorkerConnection<WorkerRouter>(worker);
const { ServerActor } = createServerConnection<AppRouter>('/_actordom');

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
  view(children: any) {
    return (
      <div>
        <h2>Name</h2>
        {children}
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
  //counter: Process<Counter> | undefined = spawn(Counter, 'Main thread counter');
  offthread = spawn(Offthread);
  receive([name, _data]: ['remove', true]) {
    switch(name) {
      case 'remove': {
        //this.counter = undefined;
        break;
      }
    }
    update(this);
  }
  view() {
    return (
      <main>
        <h1>My App</h1>
        <div>
          <button onClick="remove">Remove counter</button>
        </div>
        {this.offthread}
      </main>
    );
  }
}

mount(spawn(Main), document.querySelector('#app')!);