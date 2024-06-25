import QUnit from 'qunit';
import { exit, process, send, spawn, createWorkerConnection } from 'actordom';
import type { WorkerRouter } from './fixtures/worker1';

QUnit.module('exit signal', t => {
  QUnit.test('can exit a process in the same thread', assert => {
    assert.expect(1);
    class Test {
      receive([]: ['test', true]){
        assert.ok('got test message');
      }
    }
    let pid = spawn(Test);
    send(pid, 'test', true);

    // Send another after exiting
    exit(pid);
    send(pid, 'test', true);
  });

  QUnit.test('can exit a process in a worker', assert => {
    let done = assert.async();
    assert.expect(1);
    let worker = new Worker(new URL('./fixtures/worker1.js', import.meta.url));
    const { MyWorker } = createWorkerConnection<WorkerRouter>(worker);

    class Test {
      worker = spawn(MyWorker);
      count = 0;
      receive([name, _data]: ['start', true] | ['pong', true]) {
        switch(name) {
          case 'start': {
            this.sendPing();
            break;
          }
          case 'pong': {
            this.count++;
            assert.ok(true, 'got reply');

            if(this.count > 1) {
              done();
              return;
            }
            exit(this.worker);
            this.sendPing();
            break;
          }
        }
      }
      sendPing() {
        send(this.worker, 'ping', process(this));
      }
    }

    let pid = spawn(Test);
    send(pid, 'start', true);

    setTimeout(() => {
      done();
    }, 150);
  });
});