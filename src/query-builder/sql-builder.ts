import { Query } from "./interfaces/query";
import { ConditionGroup, SimpleKeys, Condition, Operators, IncludedKeys } from "./interfaces/utility-types";
import { Queryable } from "./queryable";
import { IUser2, IEntityType, RelationKind } from "@poseidon/core-models";
import * as util from "util";
import { BuiltInEntries } from "../data/builtin-entries";
import { DatabaseError } from "../exceptions/database-error";
import { SysMsgs } from "../exceptions/sys-msgs";
import { Pool, Client } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "poseidon",
  password: "admin",
  port: 5432,
});

const builtin = BuiltInEntries.build();
const entityType = builtin.entityType;
const repo = [builtin.entityType, builtin.entityTypeEntityProperty, builtin.entityTypeUser, builtin.entityTypeEntityProperty];
let tableCount = 0;

async function buildQuery<T = any>(entityType: IEntityType, query: Query<T>) {
  const alias = "_ROOT_";

  const included = await buildInclude(query.$include, entityType, alias);
  const select = buildSelect(query.$select, entityType, included, alias);
  const where = buildWhere(query.$where, entityType.name);

  const wrapped = `SELECT row_to_json(${alias}) \nFROM (${select + where}) as ${alias}`;
  return wrapped;
}

async function buildInclude<T>(includedKeys: IncludedKeys<T>, entityType: IEntityType, parentAlias: string): Promise<string> {
  const joined: string[] = [];
  for (const key in includedKeys) {
    const prop = entityType.props.find((p) => p.name === key);

    if (prop == null) throw new DatabaseError(SysMsgs.error.queryParseError, `Invalid property '${key}'`);

    const alias = `${parentAlias}_${key}`;
    const includedEt = prop.relatedEntityType as IEntityType;
    const includedQuery = ((<any>includedKeys)[key] === true ? {} : (<any>includedKeys)[key]) as Query<T>;
    includedQuery.$where = includedQuery.$where || [];

    const included = await buildInclude(includedQuery.$include, includedEt, alias);
    let select = buildSelect(includedQuery.$select, includedEt, included, alias);

    if (prop.relation === RelationKind.belongsToMany) {
      const relationTableAlias = `t${tableCount}`;
      const join = `INNER JOIN ${prop._relationTable} AS t${relationTableAlias}
                              ON ${relationTableAlias}."${includedEt.name}Id"
                               = ${relationTableAlias}."${entityType.name}Id"`;
      select += "\n" + join;
    } else {
      let thisCol: string;
      let parentCol: string;
      if (prop.relation === RelationKind.hasOne || prop.relation === RelationKind.hasMany) {
        thisCol = `_${entityType.name}_${includedEt.name}_${prop.name}`;
        parentCol = `${parentAlias}._id`;
      } else {
        thisCol = `_id`;
        parentCol = `${parentAlias}._${entityType.name}_${includedEt.name}_${prop.name}`;
      }

      const condition = { [thisCol]: { ["$eq"]: `$[${parentCol}]` } } as Condition<T>;

      includedQuery.$where.push(condition);
    }

    const where = buildWhere(includedQuery.$where, includedEt.name);

    const includedSql = select + where;
    joined.push(wrapIncluded(includedSql, alias, key, prop.relation));
  }

  return joined.join(", ");
}

function wrapIncluded(sql: string, alias: string, key: string, relationKind: RelationKind) {
  let wrapped = `(SELECT row_to_json(${alias}) \nFROM (${sql}) AS ${alias}) as ${key}`;
  let wrapPaginated = `
  (SELECT row_to_json(${alias})
   FROM (SELECT coalesce(array_to_json(array_agg(${alias}._row)), '[]'::json) items, coalesce(avg(${alias}._count)::int, 0) total
         FROM (SELECT row_to_json(${alias}) _row, COUNT(*) OVER() _count
               FROM (${sql}) AS ${alias}) AS ${alias}) AS ${alias}
         LIMIT 2 OFFSET 0) AS ${key}
  `;
  
  if (relationKind === RelationKind.hasMany || relationKind === RelationKind.belongsToMany) {
    return wrapPaginated;
  } else {
    return wrapped;
  }
}

function buildSelect(columns: string[], entityType: IEntityType, included: string, alias: string): string {
  columns = columns || [];
  columns.length === 0 && columns.push("*");
  included && columns.push(included);

  const columnStr = columns.join(", ");
  const selectTemplate = 'SELECT %s FROM "%s" AS "%s"';

  return util.format(selectTemplate, columnStr, entityType.name, alias);
}

let paramsCount = 1;
let paramsList: any[] = [];
function buildWhere<T>(conditionGroup: ConditionGroup<T>, root: string): string {
  const buildClauses = (conditionGroup: ConditionGroup<T>, root: string): string => {
    if (conditionGroup == null) return;

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
          const param = `$${paramsCount++}`;
          paramsList.push(value);
          clauses += ` AND ${util.format(clauseTemplate, `"${column}"`, knexOp, param)}`;
        }
      }
    }
    return clauses.replace(/^\s(AND|OR)\s/g, "");
  };

  const clauses = buildClauses(conditionGroup, root);
  return "\nWHERE " + clauses;
}

const operatorsMap = new Map<Operators, string>([["$eq", "="]]);
try {
  var query = new Queryable<IEntityType>(async (query) => null);
  var result = query
    .where((q) => q.filter("name", "$eq", "Leandro").$or((o) => o.filter("name", "$eq", "name", true)))
    .include("props", (q) => q.where((w) => w.filter("name", "$eq", (c) => c.name)))
    .include("_createdBy", (q) => q.where((f) => f.filter("name", "$eq", "Leandro")))._query;

  buildQuery(entityType, result)
    .then(async (c) => {
      // const result = await pool.query(`
      //       WITH  a AS (select *, count(*) over (range unbounded preceding)
      //       FROM "EntityProperty")
      // SELECT * from a order by "_id" limit 1 offset 0;
      // `);
      console.log(c);
    })
    .catch((c) => console.log("Error", c));
} catch (error) {}
