import { Entity } from "@poseidon/core-models";
export class ObservedCollectionProxyHandler {
  public get?(target: any, p: string, receiver: any): any {
    const val = target[p];
    
    if (typeof val === "function") {
      if (["push", "unshift"].includes(p)) {
        return function (el: Entity) {
          console.log("mutating 1");
          return Array.prototype[p as any].apply(target, arguments);
        };
      }
      if (["pop"].includes(p)) {
        return function () {
          const el = Array.prototype[p as any].apply(target, arguments);
          console.log("mutating 2");
          return el;
        };
      }
      console.log("mutating 3");
      return val.bind(target);
    }
    return val;
  }
  public set?(target: any, p: number, value: any, receiver: any): boolean {
    target[p] = value;
    return true;
  }
}
