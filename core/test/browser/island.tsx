import QUnit from 'qunit';
import { spawn, island, router } from 'actordom';
import { listenForIslands, mount } from 'actordom/dom';

QUnit.module('islands', t => {
  QUnit.test('are created', assert => {
    let done = assert.async();
    let resolve: (value: unknown) => void;
    let promise = new Promise(_resolve => resolve = _resolve);
    
    class Test {
      constructor(public a: number, public b: string){}
      receive([]) {}
      view() {
        resolve(void 0);
        return <div id="test">{this.a}-{this.b}</div>
      }
    }

    let islandRouter = router({
      Test
    });
    type IslandRouter = typeof islandRouter;

    class Parent {
      receive(){}
      view() {
        return <div id="parent" {...island<IslandRouter>()('Test', 2, 'foo')}></div>
      }
    }

    let host = document.createElement('div');

    let stopListening = listenForIslands(islandRouter, host);
    mount(spawn(Parent), host);

    let parent = host.firstElementChild as HTMLElement;
    assert.equal(parent.dataset.actor, 'Test');
    assert.deepEqual(JSON.parse(parent.dataset.args!), [2, 'foo']);

    promise.then(() => {
      assert.ok(parent.dataset.pid, 'has a pid');
      let island = parent.firstElementChild as HTMLElement;
      assert.equal(island.textContent, '2-foo');
      stopListening();
      done();
    });
  });
});
