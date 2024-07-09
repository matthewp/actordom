const _blessed = '~ad.blessed~' as const;
type BlessedSymbol = typeof _blessed;
type BlessedString = [BlessedSymbol, string];

const isBlessedSymbol = (item: unknown): item is BlessedSymbol => item === _blessed;
const isBlessedString = (item: unknown): item is BlessedString => Array.isArray(item) && isBlessedSymbol(item[0]);

function unescape(str: string) {
  return [_blessed, str];
}

export {
  type BlessedString,
  isBlessedString,
  unescape
}
