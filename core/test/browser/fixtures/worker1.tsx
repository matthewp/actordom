import { type ProcessWithMessage, listen, router, send } from 'actordom';

type mailbox = ['ping', ProcessWithMessage<['pong', true]>];

class MyWorker {
  receive([name, data]: mailbox){
    switch(name) {
      case 'ping': {
        send(data, ['pong', true]);
        break;
      }
    }
  }
}

const workerRouter = router({
  MyWorker
});

type WorkerRouter = typeof workerRouter;
listen(workerRouter);

export {
  type WorkerRouter
};