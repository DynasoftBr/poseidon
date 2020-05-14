import { Context } from "../context";
import { ObservedEntity } from "./observed-entity";

class ObservedEntityProxyHandler implements ProxyHandler<ObservedEntity> {
  public getPrototypeOf?(target: ObservedEntity): object | null {
    return Reflect.getPrototypeOf(target);
  }

  public setPrototypeOf?(target: ObservedEntity, v: any): boolean {
    return false;
  }

  public isExtensible?(target: ObservedEntity): boolean {
    return true;
  }

  public preventExtensions?(target: ObservedEntity): boolean {
    return false;
  }

  public getOwnPropertyDescriptor?(target: ObservedEntity, p: PropertyKey): PropertyDescriptor | undefined {
    return Reflect.getOwnPropertyDescriptor(target, p);
  }

  public has?(target: ObservedEntity, p: PropertyKey): boolean {
    return Reflect.has(target, p);
  }

  public get?(target: ObservedEntity, p: PropertyKey, receiver: any): any {
    return Reflect.get(target, p, receiver);
  }

  public set?(target: ObservedEntity, p: string, value: any, receiver: any): boolean {
    // const entityType = target.getEntityType();
    // const prop = entityType.props.find((pr) => pr.name === p);
    // if (prop.type === PropertyTypes.relation && !value["___observed"]) {
    //   target[p] = ObservedEntity.create<Entity>(value, prop.relatedEntityType);
    // }

    console.log(p);
    target[p] = value;
    return true;
  }

  public deleteProperty?(target: ObservedEntity, p: PropertyKey): boolean {
    throw "Properties can not be deleted";
  }

  public defineProperty?(target: ObservedEntity, p: PropertyKey, attributes: PropertyDescriptor): boolean {
    return target.defineProperty(target, p, attributes);
  }
}
export const proxyHandler = new ObservedEntityProxyHandler();

