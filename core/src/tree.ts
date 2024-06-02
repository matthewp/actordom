const _tree = Symbol('ftree');

function createTree(): Tree {
  let out: any = [];
  out[_tree] = true;
  return out;
}

function isTree(obj: any): obj is Tree {
  return !!(obj && obj[_tree]);
}

type OpenInstruction = [1, string, any, Array<string>];
type TextInstruction = [4, string];
type CloseInstruction = [2, string];
type ActorInstruction = [5, any] | [5, any, Tree];

type Tree = Array<
  OpenInstruction | TextInstruction | CloseInstruction | ActorInstruction
> & {
  [_tree]: boolean;
}

export {
  type Tree,
  type OpenInstruction,
  isTree,
  createTree
}