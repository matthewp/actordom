import {
  type Connection,
  createWorkerConnection,
  router,
  spawn,
  send
} from 'actordom';
import test from 'node:test';

test('router types', () => {
  class Test {
    receive([]: ['one', true]){}
  }
  let testRouter = router({
    Test
  });
  type TestRouter = typeof testRouter;
  let conn: Connection<TestRouter> = createWorkerConnection(new Worker('/test'));
  let pid = spawn(conn.Test);
  send(pid, 'one', true);
});
