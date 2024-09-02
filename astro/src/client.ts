import { type ViewActorType, spawn } from 'actordom';
import { mount } from 'actordom/dom';

console.log("CLIENT2");

export default (element: HTMLElement) => (Component: ViewActorType) => {
  let pid = spawn(Component);
  mount(pid, element);
}
