import { isTree, createTree } from './tree.js';
import { isPID } from './pid.js';

const Fragment = () => {};

function isPrimitive(type: string) {
  return type === 'string' || type === 'number' || type === 'boolean';
}

const eventAttrExp = /^on[A-Z]/;
function signal(_tagName: string, attrName: string, attrValue: any, attrs: Record<string, any>) {
  if(eventAttrExp.test(attrName)) {
    let eventName = attrName.toLowerCase();
    return [1, eventName, attrValue];
  }
}

function jsx(type: any, props: any, key: any, __self: any, __source: any) {
  let children = props.children;
  let childrenType = typeof props.children;

  if(isTree(children) || isPrimitive(childrenType)) {
    children = [children];
  }

  let isFn = typeof type === 'function';

  if(isFn) {
    return (type)(props || {}, children);
  }

  let tree = createTree();
  let uniq: any, evs: Array<any> | undefined;
  if(props) {
    props = Object.keys(props).reduce(function(acc, key){
      let value = (props as any)[key];

      let eventInfo = signal(type as any, key, value, props as any);
      if(eventInfo) {
        if(!evs) evs = [];
        evs.push(eventInfo);
      } else if(key === 'key') {
        uniq = value;
      } else if(key === 'children') {
        return acc;
      } else {
        // @ts-ignore
        acc.push(key);
        // @ts-ignore
        acc.push(value);
      }

      return acc;
    }, []);
  }

  let open = [1, type, uniq];
  if(props) {
    open.push(props);
  }
  if(evs) {
    open.push(evs);
  }
  tree.push(open as any);

  if(childrenType !== 'undefined') {
    children.forEach(function(child: any){
      if(typeof child !== 'undefined' && !Array.isArray(child)) {
        if(isPID(child)) {
          tree.push([5, child]);
          return;
        }
  
        tree.push([4, child + '']);
        return;
      }

      while(child && child.length) {
        let item = child.shift();
        if(isPID(item)) {
          tree.push([5, item]);
          continue;
        }
        tree.push(item);
      }
    });
  }

  tree.push([2, type]);

  return tree;
}

export {
  jsx,
  jsx as jsxs,
  jsx as jsxDEV,
  Fragment
};