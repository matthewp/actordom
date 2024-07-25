import test from 'node:test';
import {
  type Actor,
  type Connection,
  createWorkerConnection,
  router,
  spawn,
  send
} from 'actordom';
import { type AuthMailbox, createAuthRelay } from 'actordom/auth';
import { expectTypeOf } from 'expect-type';

export type Tail<T extends any[]> = T extends [infer _A, ...infer R] ? R : never;

test('errors when passing an Actor that does not take the user type', () => {
  type User = { name: string; };

  class Test {
    constructor(public user: User, public arg: number){}
    receive([]: ['one', number]){}
  }

  class AuthHandler {
    receive([]: AuthMailbox<User>){}
  }

  let relay = createAuthRelay<User>(AuthHandler);
  let routes = relay({
    Test
  });

  type SpawnParams = Tail<Parameters<typeof spawn<typeof routes.Test, typeof routes.Test>>>;
  expectTypeOf<SpawnParams>().toEqualTypeOf<[number]>();
  expectTypeOf(routes.Test).constructorParameters.toEqualTypeOf<[number]>()
});
