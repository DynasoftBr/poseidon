import { FilterBuilderInterface, ConditionGroup, SimpleKeys, Operators, Condition, KeySelector } from "./interfaces/utility-types";

export class QueryableFilter<T, TRoot> implements FilterBuilderInterface<T, TRoot> {
  constructor(private readonly group: ConditionGroup<T>) {}

  where<K extends SimpleKeys<T>>(key: K, operator: Operators, operand: T[K]): this;
  where<K extends SimpleKeys<T>>(key: K, operator: Operators, operand: (root: KeySelector<TRoot>) => void): this;
  where<K extends SimpleKeys<T>>(key: K, operator: Operators, operand: K, field?: boolean): this;
  where<K extends SimpleKeys<T>>(
    key: K,
    operator: Operators,
    operand: T[K] | K | ((root: KeySelector<TRoot>) => void),
    field?: boolean
  ): this {
    const condition: Condition<T> = {};

    let computedOperand = "";
    if (typeof operand === "function") {
      computedOperand = "_ROOT_";
      const proxyHandler = {
        get(target: KeySelector<TRoot>, prop: string): KeySelector<TRoot> {
          const splitted = computedOperand.split(".");
          computedOperand = [splitted[0], splitted[1]].filter((c) => !!c).join("_") + `.${prop}`;

          return proxy;
        },
      };
      const proxy = new Proxy<KeySelector<TRoot>>({} as any, proxyHandler);

      (<(root: KeySelector<TRoot>) => void>operand)(proxy);
      computedOperand = `$[${computedOperand}]`;
    } else if (field === true) {
      computedOperand = `$[${operand}]`;
    } else {
      computedOperand = operand as string;
    }

    condition[key] = { [operator]: computedOperand };

    this.group.push(condition);

    return this;
  }

  $or(func: (builder: QueryableFilter<T, TRoot>) => void): this {
    const orGroup: ConditionGroup<T> = [];
    const builder = new QueryableFilter<T, TRoot>(orGroup);
    func && func(builder);

    this.group.push(orGroup);
    return this;
  }
}
