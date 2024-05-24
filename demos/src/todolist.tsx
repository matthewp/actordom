import { send, spawn, update, process, type Process } from 'actordom';

type Todo = { title: string; done: boolean };

type storageMailbox = ['add', Todo]
  | ['update', { index: number; todo: Todo }]
  | ['remove', number];

class Storage {
  todos: Todo[] = [];
  receive([name, data]: storageMailbox) {
    switch(name) {
      case 'add': {
        this.todos.push(data);
        this.save();
        break;
      }
      case 'update': {
        this.todos[data.index] = data.todo;
        this.save();
        break;
      }
      case 'remove': {
        this.todos.splice(data, 1);
        this.save(); 
        break;
      }
    }
  }
  save() {
    localStorage.setItem('todos', JSON.stringify(this.todos));
  }
}

type todoItemMailbox = ['item', Todo]
  | ['title', { target: HTMLInputElement }]
  | ['done', { target: HTMLInputElement }]
  | ['remove', MouseEvent];

class TodoItem {
  constructor(public index: number, public todo: Todo, public list: Process<TodoList>, public storage: Process<Storage>) {}
  persist() {
    send(this.storage, ['update', { index: this.index, todo: this.todo }]);
  }
  receive([name, data]: todoItemMailbox) {
    switch(name) {
      case 'title': {
        this.todo.title = data.target.value;
        this.persist();
        break;
      }
      case 'done': {
        let oldValue = this.todo.done;
        this.todo.done = data.target.checked;
        this.persist();
        if(this.todo.done !== oldValue) {
          send(this.list, ['done', {
            index: this.index,
            done: this.todo.done,
          }])
        }
        break;
      }
      case 'remove': {
        send(this.list, ['remove', this.index]);
        send(this.storage, ['remove', this.index]);
        break;
      }
    }
    update(this);
  }
  view() {
    return (
      <div>
        <input
          type="checkbox"
          checked={this.todo?.done}
          onChange="done"
        />
        <input
          type="text"
          value={this.todo?.title}
          onChange="title"
        />
        <button onClick="remove">x</button>
      </div>
    )
  }
}

type todoListMailbox = ['add', actordom.JSX.TargetedSubmitEvent<HTMLFormElement>]
  | [ 'set-title', actordom.JSX.TargetedInputEvent<HTMLInputElement>]
  | ['done', { done: boolean; index: number; }]
  | ['remove', number]
  | ['clear-completed', Event];

class TodoList {
  newTitle = '';
  todos: Array<Process<TodoItem>> = [];
  done = new Set<number>();
  storage = spawn(Storage);
  receive([name, data]: todoListMailbox){
    switch(name) {
      case 'add': {
        data.preventDefault();
        let todo = {
          title: this.newTitle,
          done: false,
        };
        let todoItem = spawn(TodoItem, this.todos.length, todo, process(this), this.storage);

        send(this.storage, ['add', todo]);
        this.todos.push(todoItem);

        this.newTitle = '';
        data.currentTarget.reset();
        break;
      }
      case 'set-title': {
        this.newTitle = data.currentTarget.value;
        return;
      }
      case 'done': {
        //this.doneCount += (data ? 1 : -1);
        if(data.done) {
          this.done.add(data.index);
        } else {
          this.done.delete(data.index);
        }
        break;
      }
      case 'remove': {
        this.todos.splice(data, 1);
        this.done.delete(data);
        break;
      }
      case 'clear-completed': {
        for(let index of this.done) {
          this.todos.splice(index, 1);
          this.done.delete(index);
        }
        break;
      }
    }
    update(this);
  }
  view() {
    let doneCount = this.done.size;
    return (
      <div>
        <h2>Simple Todos Example</h2>
        <form onSubmit="add">
          <input
            placeholder="enter todo and click +"
            required
            value={this.newTitle}
            onInput="set-title"
          />
          <button>+</button>
        </form>
        {
          this.todos.map(todoItem => todoItem)
        }
        <footer>
          Completed: {doneCount}
          {doneCount > 0 ? (
            <div>
              <button onClick="clear-completed">Clear completed</button>
            </div>
          ): <></>}
        </footer>
      </div>
    )
  }
}

export {
  TodoList
};