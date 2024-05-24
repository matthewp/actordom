
import type { ActorType } from './actor.js';

export type Registry<N extends string = string, A extends ActorType = ActorType> = {
  [x in N]: A;
};