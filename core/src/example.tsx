import { spawn, type DOMActor } from './main';
import { mount } from './dom';

class MyThing {
  constructor() {
    mount(this, document.body);
  }
  receive([]: ['increment', Event]){}
  view() {
    return (
      <div>
        <button onClick="fofo"></button>
      </div>
    )
  }
}

spawn(MyThing);