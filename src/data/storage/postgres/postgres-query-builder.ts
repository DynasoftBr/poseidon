import { Query } from "../../../query-builder/interfaces/query";
import { ConditionGroup, SimpleKeys, Condition, Operators, IncludedKeys } from "../../../query-builder/interfaces/utility-types";
import { Queryable } from "../../../query-builder/queryable";
import { EntityType, RelationKind, SysProperties } from "@poseidon/core-models";
import * as util from "util";
import { BuiltInEntries } from "../../builtin-entries";
import { DatabaseError } from "../../../exceptions/database-error";
import { SysMsgs } from "../../../exceptions/sys-msgs";

const operatorsMap = new Map<string, string>([["$eq", "="]]);
export class PostgresQueryBuilder {
  private paramsCount = 1;
  public paramsList: any[] = [];

  public async buildQuery<T = any>(entityType: EntityType, query: Query<T>) {
    const alias = "_ROOT_";

    const included = await this.buildInclude(query.$include, entityType, alias);
    const select = this.buildSelect(query.$select, entityType, included, alias);
    const where = this.buildWhere(query.$where, entityType.name);

    const wrapped = `SELECT row_to_json(${alias}) \nFROM (${select + where}) as ${alias}`;
    return wrapped;
  }

  private async buildInclude<T>(includedKeys: IncludedKeys<T>, entityType: EntityType, parentAlias: string): Promise<string> {
    const joined: string[] = [];
    for (const key in includedKeys) {
      const prop = entityType.props.find((p) => p.name === key);

      if (prop == null) throw new DatabaseError(SysMsgs.error.queryParseError, `Invalid property '${key}'`);

      const alias = `${parentAlias}_${key}`;
      const includedEt = prop.relatedEntityType as EntityType;
      const includedQuery = ((<any>includedKeys)[key] === true ? {} : (<any>includedKeys)[key]) as Query<T>;
      includedQuery.$where = includedQuery.$where || [];

      const included = await this.buildInclude(includedQuery.$include, includedEt, alias);
      let select = this.buildSelect(includedQuery.$select, includedEt, included, alias);
      const join = `\nINNER JOIN "${entityType.name}_${prop.name}" ON "${entityType.name}_${prop.name}".related = "${alias}"."${SysProperties._id}"`;
      includedQuery.$where.push({ ["entity"]: { ["$eq"]: `$[${parentAlias}.${SysProperties._id}]` } } as Condition<T>);

      const where = this.buildWhere(includedQuery.$where, includedEt.name);

      const includedSql = select + join + where;
      joined.push(this.wrapIncluded(includedSql, alias, key, prop.kind));
    }

    return joined.join(", ");
  }

  private wrapIncluded(
    sql: string,
    alias: string,
    key: string,
    relationKind: RelationKind,
    limit: number = null,
    offset: number = null
  ): string {
    const wrappedSingleRow = `(SELECT row_to_json(${alias}) \nFROM (${sql}) AS ${alias}) as ${key}`;
    const wrapPaginated = `
    (SELECT row_to_json(${alias})
     FROM (SELECT coalesce(array_to_json(array_agg(${alias}._row)), '[]'::json) items, coalesce(avg(${alias}._count)::int, 0) total
           FROM (SELECT row_to_json(${alias}) _row, COUNT(*) OVER() _count
                 FROM (${sql}) AS ${alias}) AS ${alias}) AS ${alias}
           LIMIT 2 OFFSET 0) AS ${key}
    `;
    const wrapMany = `(
      SELECT coalesce(array_to_json(array_agg(row_to_json(${alias}))),'[]'::json) \nFROM (${sql}) AS ${alias}
      LIMIT 1000 OFFSET 0
    ) as ${key}`;

    if (relationKind === RelationKind.hasMany || relationKind === RelationKind.belongsToMany) {
      if (limit || offset) return wrapPaginated;
      else return wrapMany;
    } else {
      return wrappedSingleRow;
    }
  }

  private buildSelect(columns: string[], entityType: EntityType, included: string, alias: string): string {
    columns = columns || [];
    columns.length === 0 && columns.push("*");
    included && columns.push(included);

    const columnStr = columns.join(", ");
    const selectTemplate = 'SELECT %s FROM "%s" AS "%s"';

    return util.format(selectTemplate, columnStr, entityType.name, alias);
  }

  private buildWhere<T>(conditionGroup: ConditionGroup<T>, root: string): string {
    const buildClauses = (conditionGroup: ConditionGroup<T>, root: string): string => {
      if (conditionGroup == null) return "";

      const clauseTemplate = "%s %s %s";
      let clauses: string = "";

      for (const condition of conditionGroup) {
        if (Array.isArray(condition)) {
          const or = buildClauses(condition, root);

          clauses += ` OR (${or})`;
        } else {
          const column = Object.keys(condition)[0] as SimpleKeys<T>;
          const operation = (<Condition<T>>condition)[column];
          const operator = Object.keys(operation)[0] as Operators;
          const knexOp = operatorsMap.get(operator);
          const value = operation[operator];
          let match: RegExpMatchArray;

          if (typeof value === "string" && value && !!(match = value.match(/\$\[([^)]+)\]/))) {
            const splitted = match[1].split(".");
            const columns2 = splitted.length > 1 ? [`"${splitted[0]}"`, `"${splitted[1]}"`].join(".") : `"${splitted[0]}"`;
            clauses += ` AND ${util.format(clauseTemplate, `"${column}"`, knexOp, columns2)}`;
          } else {
            const param = `$${this.paramsCount++}`;
            this.paramsList.push(value);
            clauses += ` AND ${util.format(clauseTemplate, `"${column}"`, knexOp, param)}`;
          }
        }
      }
      return clauses.replace(/^\s(AND|OR)\s/g, "");
    };

    const clauses = buildClauses(conditionGroup, root);
    return clauses ? "\nWHERE " + clauses : "";
  }
}
