const _tree = '~ad.tree~' as const;
type TreeSymbol = typeof _tree;

const isTreeSymbol = (item: unknown): item is TreeSymbol => item === _tree;

function createTree(): Tree {
  let out: Tree = [_tree];
  return out;
}

function isTree(obj: unknown): obj is Tree {
  return Array.isArray(obj) && isTreeSymbol(obj[0]);
}

type OpenInstruction = [1, string, any, Array<string>];
type TextInstruction = [4, string];
type CloseInstruction = [2, string];
type ActorInstruction = [5, any] | [5, any, Tree];

type TreeInstruction = OpenInstruction | TextInstruction | CloseInstruction | ActorInstruction;

type Tree = [TreeSymbol, ...TreeInstruction[]];

export {
  type Tree,
  type OpenInstruction,
  isTree,
  isTreeSymbol,
  createTree
}