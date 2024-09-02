import type { ViewActorType } from "actordom";
import { renderToString } from 'actordom/server';

function check(Component: unknown) {
  if(typeof Component !== 'function') {
    return false;
  }
  if(typeof Component.prototype.receive !== 'function') {
    return false;
  }
  if(typeof Component.prototype.view !== 'function') {
    return false;
  }
  return true;
}

function renderToStaticMarkup(Component: ViewActorType) {
  let instance = new Component();
  let dom = instance.view();
  let html = renderToString(dom);
  return {
    html
  };
}

export default {
  renderToStaticMarkup,
  check,
};

