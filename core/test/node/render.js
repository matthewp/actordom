import { test } from 'node:test';
import { spawn } from 'actordom';
import { renderToString } from 'actordom/node';
import { jsx } from 'actordom/jsx-runtime';
import assert from 'assert';

test('renderToString basics', t => {
  let dom = jsx('main', {
    id: 'app',
    class: 'app',
    children: [jsx('p', { children: 'works' })]
  });
  let html = renderToString(dom);
  let expected = `<main id="app" class="app"><p>works</p></main>`
  assert.equal(html, expected);
});

test('renderToString actor', t => {
  class MyActor {
    receive(){}
    view() {
      return jsx('p', { children: 'works' })
    }
  }
  let pid = spawn(MyActor);
  let dom = jsx('main', { children: pid });
  let html = renderToString(dom);
  assert.equal(html, '<main><p>works</p></main>');
});