import { test } from 'node:test';
import { renderToString } from 'actordom/node';
import { jsx } from 'actordom/jsx-runtime';
import assert from 'assert';

test('renderToString basics', t => {
  let vdom = jsx('main', {
    id: 'app',
    class: 'app',
    children: [jsx('p', { children: 'works' })]
  });
  let html = renderToString(vdom);
  let expected = `<main id="app" class="app"><p>works</p></main>`
  assert.equal(html, expected);
});