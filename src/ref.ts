const _ref = Symbol.for('ref');

type Ref<T = any> = {
  [_ref]: true;
  value: T | null;
}

function ref<T = any>(): Ref<T> {
  return { [_ref]: true, value: null };
}
let isRef = (o: unknown) => o != null && (o as any)[_ref];

export {
  ref,
  isRef
}