import { EntityType, SysProperties, SimpleTypes, SysEntities, RelationKind } from "@poseidon/core-models";
import { Query } from "../../../query-builder/interfaces/query";
import { IncludedKeys, Condition, ConditionGroup, SimpleKeys, Operators } from "../../../query-builder/interfaces/utility-types";
import { DatabaseError, SysMsgs } from "../../../exceptions";
import { MongoAggregate, MongoLookup, MongoProjection, MongoMatch, MongoMatchOperator } from "./mongo-aggregate";
import { Queryable } from "../../../query-builder/queryable";
import { preProcessFile } from "typescript";

export class MongoQueryBuilder {
  public async buildQuery<T = any>(entityType: EntityType, query: Query<T>): Promise<MongoAggregate[]> {
    const where = this.buildWhere(query.$where, entityType.name);
    const included = await this.buildInclude(query.$include, entityType);
    const projection = this.buildProjection(entityType, query.$select, Object.keys(query.$include || {}));

    var aggregate: MongoAggregate[] = [];
    aggregate.push(where, ...included, projection);

    return aggregate;
  }

  private async buildInclude<T>(includedKeys: IncludedKeys<T>, entityType: EntityType): Promise<MongoAggregate[]> {
    const lookups: MongoAggregate[] = [];

    for (const key in includedKeys) {
      const prop = entityType.props.find((p) => p.name === key);

      if (prop == null) throw new DatabaseError(SysMsgs.error.queryParseError, `Invalid property '${key}'`);

      // Get related entity.
      const includedEt = prop.relatedEntityType as EntityType;

      // We can have another query or just a true that indicates we are selecting all simple fields.
      const includedQuery = ((<any>includedKeys)[key] === true ? {} : (<any>includedKeys)[key]) as Query<T>;
      includedQuery.$where = includedQuery.$where || [];

      const included = await this.buildQuery(includedEt, includedQuery);
      var lookup: MongoLookup = {
        from: SysEntities.relationLink,
        let: { localField: `$${SysProperties._id}` },
        as: prop.name,
        pipeline: [
          {
            $match: {
              $expr: { $eq: [`$${SysProperties.thisId}`, `$$localField`] },
              [SysProperties.relationPropId]: prop._id,
            },
          },
          {
            $lookup: {
              from: includedEt.name,
              let: { foreignField: `$${SysProperties.thatId}` },
              as: "included",
              pipeline: [{ $match: { $expr: { $eq: [`$${SysProperties._id}`, "$$foreignField"] } } }, ...included],
            },
          },
          { $addFields: { [`included`]: { $arrayElemAt: [`$included`, 0] } } },
        ],
      };
      lookups.push({ $lookup: lookup });

      if (prop.relationKind === RelationKind.hasOne || prop.relationKind === RelationKind.belongsToOne) {
        lookups.push({ $addFields: { [`${prop.name}`]: { $arrayElemAt: [`$${prop.name}`, 0] } } });
      }
    }

    return lookups;
  }

  private buildProjection(entityType: EntityType, selectedFields: string[], includedKeys: string[]): MongoAggregate {
    const simpleTypes = Object.values(SimpleTypes) as string[];
    selectedFields = selectedFields || entityType.props.filter((p) => simpleTypes.includes(p.type)).map((p) => p.name);

    const projection: MongoProjection = {};
    for (const key of selectedFields) {
      projection[key] = 1;
    }
    for (const key of includedKeys) {
      projection[key] = `$${key}.included`;
    }

    if (!selectedFields.find((k) => k == SysProperties._id)) projection[SysProperties._id] = 0;

    return { $project: projection };
  }

  private buildWhere<T>(conditionGroup: ConditionGroup<T>, root: string): MongoAggregate {
    if (conditionGroup == null) return { $match: {} }; // Empty match, which matches everything.

    const buildClauses = (conditionGroup: ConditionGroup<T>, root: string): MongoMatch => {
      var mongoMatch: MongoMatch = {};

      for (const condition of conditionGroup) {
        if (Array.isArray(condition)) {
          const or = buildClauses(condition, root);

          var matchKeys = Object.keys(mongoMatch);
          if (matchKeys.length == 0) {
            mongoMatch.$or = [or];
          } else {
            var orKey = matchKeys.find((k) => k == "$or");

            if (orKey != null) {
              mongoMatch.$or.push(or);
            } else {
              mongoMatch = { $or: [mongoMatch, or] };
            }
          }
        } else {
          const field = Object.keys(condition)[0] as SimpleKeys<T>;
          const operation = (<Condition<T>>condition)[field];
          const operator = Object.keys(operation)[0] as Operators;
          let value = operation[operator];

          let match: RegExpMatchArray;
          if (typeof value === "string" && value && !!(match = value.match(/\$\[([^)]+)\]/))) value = match[1];

          mongoMatch[field] = this.buildMatchOperation(operator, value);
        }
      }

      return mongoMatch;
    };

    return { $match: buildClauses(conditionGroup, root) };
  }

  private buildMatchOperation(operator: Operators, value: any): MongoMatchOperator {
    if (operator == "$eq") {
      return { $eq: value };
    }
  }
}
