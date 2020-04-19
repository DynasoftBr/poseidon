import { HavingBuilder, HavingConditionGroup, KnownKeys, Operators, HavingCompareFunc, HavingOperandFuncion, AggregateFuncs, HavingCondition } from "./interfaces/utility-types";

export class QueryableHaving<T> implements HavingBuilder<T> {
  constructor(private readonly group: HavingConditionGroup<T>) { }
  $or(func: (builder: HavingBuilder<T>) => void): this {
    const orGroup: HavingConditionGroup<T> = [];
    const builder = new QueryableHaving(orGroup);
    func && func(builder);

    this.group.push(orGroup);
    return this;
  }

  $sum<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: T[K]): this;
  $sum<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: (f: HavingCompareFunc<T>) => void): this;
  $sum<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: K | T[K], field?: boolean): this;
  $sum<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: K | T[K] | HavingOperandFuncion<T>, field?: boolean): this {
    return this.addHavingCondition("$sum", key, operator, operand);
  }

  $count<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: T[K]): this;
  $count<K extends KnownKeys<T, number>>(key: K, operator: Operators, func: (f: HavingCompareFunc<T>) => void): this;
  $count<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: K | T[K], field?: boolean): this;
  $count<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: K | T[K] | HavingOperandFuncion<T>, field?: boolean): this {
    return this.addHavingCondition("$sum", key, operator, operand);
  }

  $avg<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: T[K]): this;
  $avg<K extends KnownKeys<T, number>>(key: K, operator: Operators, func: (f: HavingCompareFunc<T>) => void): this;
  $avg<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: K | T[K], field?: boolean): this;
  $avg<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: K | T[K] | HavingOperandFuncion<T>, field?: boolean): this {
    return this.addHavingCondition("$sum", key, operator, operand);
  }

  private addHavingCondition<K extends KnownKeys<T, number>>(
    func: AggregateFuncs, key: K, operator: Operators, operand: K | T[K] | HavingOperandFuncion<T>, field?: boolean): this {

    const operandResult = typeof operand !== "function"
      ? (!field ? operand : `$[${operand}]`)
      : (<HavingOperandFuncion<T>>operand)({});

    const condiion: HavingCondition<T> = { [func]: { [key]: { [operator]: operandResult } } };

    this.group.push(condiion);

    return this;
  }
}
