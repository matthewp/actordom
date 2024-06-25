import QUnit from 'qunit';
import { type Actor, type Process, spawn } from 'actordom';
import { mount } from 'actordom/dom';

QUnit.module('basics', t => {
  QUnit.test('boolean attributes', assert => {
    class Test {
      receive([]) {}
      view() {
        /** @ts-ignore */
        return <div one={true} two={false}>testing</div>
      }
    }
    let host = document.createElement('div');
    mount(spawn(Test), host);
    let el = host.firstElementChild!;
    assert.ok(el.hasAttribute('one'), 'has the one attribute');
    assert.equal(el.getAttribute('one'), '');
    assert.ok(!el.hasAttribute('two'));
  });

  QUnit.test('children', assert => {
    class One {
      receive(){}
      view(children: Process<Actor>) {
        return <div class="children">{children}</div>
      }
    }
    class Test {
      one = spawn(One);
      receive(){}
      view() {
        const One = this.one;
        return (
          <div>
            <One>
              <div class="inner">inner</div>
            </One>
          </div>
        );
      }
    }
    let host = document.createElement('div');
    mount(spawn(Test), host);
    let el = host.firstElementChild!;
    assert.ok(el.querySelector('.children'));
    assert.ok(el.querySelector('.children .inner'));
    assert.equal(el.querySelector('.children .inner')!.textContent, 'inner');
  });
});

