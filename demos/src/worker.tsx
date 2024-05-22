import { spawn, register } from '../../src/worker';

export class Offthread {
  receive(){}
}

export default register(Offthread, 'Offthread');
