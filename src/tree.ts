const _tree = Symbol('ftree');

function createTree(): Tree {
  let out: any = [];
  out[_tree] = true;
  return out;
}

function isTree(obj: any): obj is Tree {
  return !!(obj && obj[_tree]);
}

type Tree = Array<any> & {
  [_tree]: boolean;
}

export {
  type Tree,
  isTree,
  createTree
}