import QUnit from './qunit.js';
import { send, spawn, update } from 'actordom';
import { mount } from 'actordom/dom';

QUnit.module('rendering', () => {
  QUnit.test('ViewActor return a fragment', assert => {
    class Test {
      receive(){}
      view() {
        return (
          <>
            <div>one</div>
            <div>two</div>
          </>
        )
      }
    }
    let host = document.createElement('div');
    mount(spawn(Test), host);

    assert.equal(host.firstElementChild?.textContent, 'one');
    assert.equal(host.firstElementChild?.nextElementSibling?.textContent, 'two');
  });

  QUnit.test('Fragment from an inner ViewActor', assert => {
    class One {
      receive(){}
      view() {
        return (
          <>
            <span>one</span>
            <span>two</span>
            <span>three</span>
            <span>four</span>
          </>
        )
      }
    }
    class Test {
      one = spawn(One);
      receive(){}
      view() {
        return (
          <>
            {this.one}
            <span class="after"></span>
            <span class="after"></span>
          </>
        )
      }
    }
    let host = document.createElement('div');
    mount(spawn(Test), host);
    let one = host.firstElementChild;
    assert.equal(one?.textContent, 'one');
    let two = one?.nextElementSibling;
    assert.equal(two?.textContent, 'two');
    let three = two?.nextElementSibling;
    assert.equal(three?.textContent, 'three');
    let four = three?.nextElementSibling;
    assert.equal(four?.textContent, 'four');

    let after = four?.nextElementSibling;
    assert.ok(after?.classList.contains('after'), 'after span left alone');
    let after2 = after?.nextElementSibling;
    assert.ok(after2?.classList.contains('after'), 'another after span left alone');
  });

  QUnit.test('Adding more content to a fragment on rerender works', assert => {
    class One {
      count = 1;
      receive([]: ['two', boolean]){
        this.count = 2;
        update(this);
      }
      view() {
        return (
          <>
            <span>one</span>
            {this.count === 2 ? (
              <>
                <span>two</span>
                <span>three</span>
              </>
            ): <></>}
          </>
        )
      }
    }
    let one = spawn(One);
    class Test {
      receive(){}
      view() {
        return (
          <>
            {one}
            <span class="after"></span>
          </>
        )
      }
    }
    let host = document.createElement('div');
    mount(spawn(Test), host);
    let oneEl = host.firstElementChild;
    assert.equal(oneEl?.textContent, 'one');
  
    let afterEl = oneEl?.nextElementSibling;
    assert.ok(afterEl?.classList.contains('after'), 'after span left alone');

    // Send a message causing a rerender
    send(one, ['two', true]);

    let twoEl = oneEl?.nextElementSibling;
    assert.equal(twoEl?.textContent, 'two');
    let threeEl = twoEl?.nextElementSibling;
    assert.equal(threeEl?.textContent, 'three');

    afterEl = threeEl?.nextElementSibling;
    assert.ok(afterEl?.classList.contains('after'), 'after span left alone');
  });
});