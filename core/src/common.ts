

// https://www.totaltypescript.com/concepts/the-prettify-helper
export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

export function isPlainFunction<T extends () => {}>(value: any): value is T {
  if(value.prototype === undefined) return true;
  let names = Object.getOwnPropertyNames(value.prototype);
  return names.length === 1 && names[0] === 'constructor';
}
