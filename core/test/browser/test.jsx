import QUnit from './qunit.js';
import { spawn } from 'actordom';
import { mount } from 'actordom/dom';

QUnit.module('basics', t => {
  QUnit.test('first', assert => {
    assert.ok(true);
  });

  QUnit.test('boolean attributes', assert => {
    class Test {
      receive([]) {}
      view() {
        return <div one={true} two={false}>testing</div>
      }
    }
    let host = document.createElement('div');
    mount(spawn(Test), host);
    let el = host.firstElementChild;
    assert.ok(el.hasAttribute('one'), 'has the one attribute');
    assert.equal(el.getAttribute('one'), '');
    assert.ok(!el.hasAttribute('two'));
  });
});

