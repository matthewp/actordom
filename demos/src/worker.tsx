import { router, listen, update } from 'actordom/worker';

class Offthread {
  count = 0;
  receive([name]: ['increment', Event]) {
    switch(name) {
      case 'increment': {
        this.count++;
        break;
      }
    }
    update(this);
  }
  view() {
    return (
      <div>
        <h2>Worker actor</h2>
        <p>this is running in a web worker</p>
        <div>Count: {this.count}</div>
        <button type="button" onMouseDown="increment">Increment</button>
      </div>
    )
  }
}

const workerRouter = router({
  Offthread
});

listen(workerRouter);

type WorkerRouter = typeof workerRouter;

export {
  type WorkerRouter,
  type Offthread
};