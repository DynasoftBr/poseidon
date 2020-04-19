import { Interpreter } from "./interpreter";
import { IInclude, IQueryModel } from "../../../../poseidon-query-builder/query-model";
import { IEntityType, PropertyTypes } from "@poseidon/core-models";
import { IRepository } from "../../../data";
import { PoseidonToMongoDbQueryInterpreter } from "./poseidon-to-mongodb-query-interpreter";
import { MatchInterpreter } from "./match-interpreter";
import { InterpreterHelper } from "./interpreter-helper";
import _ = require("lodash");

export class IncludeInterpreter implements Interpreter {
  constructor(
    private repo: IRepository<IEntityType>,
    private entityType: IEntityType,
    private path: string,
    private pipeline: IQueryModel
  ) {}

  async interpret() {
    const splittedKeys = this.path.split(".");
    const lastIdx = splittedKeys.length - 1;
    const interpreters: Interpreter[] = [];
    const breadcrumbArr: string[] = [];
    let anyArray = false;
    let isReverse = false;
    let currEntityType = this.entityType;
    let foreignKey: string;
    let relatedProp: string;

    // for (const [idx, k] of splittedKeys.entries()) {
    //   const prop = currEntityType.props.find(p => p.name === k);
    //   const { type, items, ref } = prop.validation;
    //   const isNestedProp = lastIdx > 0;
    //   const isLastKey = idx == lastIdx;
    //   const isArrayProp = type === PropertyTypes.array;
    //   const isAbstractEntityProp =
    //     type === PropertyTypes.abstractEntity || (isArrayProp && items.type === PropertyTypes.abstractEntity);
    //   const relatedEtId = isArrayProp ? items.ref._id : ref._id;

    //   if (isNestedProp && !isAbstractEntityProp && !isLastKey) throw "When using nested props each one should be";

    //   anyArray = anyArray || isArrayProp;
    //   breadcrumbArr.push(isArrayProp ? `${prop.name}[0]` : `${prop.name}`);
    //   currEntityType = await this.repo.findById(relatedEtId);

    //   if (isLastKey) {
    //     isReverse = items && items.type === PropertyTypes.reverseRelation;

    //     if (!isReverse) {
    //       foreignKey = `${this.path}._id`;
    //       relatedProp = "$_id";
    //     } else {
    //       foreignKey = "_id";
    //       relatedProp = `$${items.reverseProp}._id`;
    //     }
    //   }
    // }

    const matchOp = anyArray ? "$in" : "$eq";
    const variable = `var_${InterpreterHelper.VariableCount}`;
    const result: any[] = [];
    const breadcrumb = breadcrumbArr.join(".");
    const asParam = anyArray ? this.pushFlattenArrayRefsStage(result, breadcrumb) : foreignKey;
    const subPipeline = [...(await new MatchInterpreter({ $expr: { [matchOp]: [relatedProp, "$$" + variable] } }).interpret())];

    if (this.pipeline.$match) subPipeline.push(...(await new MatchInterpreter(this.pipeline.$match).interpret()));

    result.push({
      $lookup: {
        from: currEntityType.name,
        let: { [variable]: "$" + asParam },
        pipeline: subPipeline,
        as: asParam
      }
    });

    if (anyArray) {
      const breadcrumbObj = _.set({}, breadcrumb, true);
      const firstCrumb = Object.values(breadcrumbObj)[0];
      const firstCrumbKey = Object.keys(breadcrumbObj)[0];

      result.push({
        $addFields: Array.isArray(firstCrumb)
          ? this.addArrayMap(firstCrumbKey, firstCrumb, "$$ROOT", "")
          : this.addMergeObject(firstCrumbKey, firstCrumb, "$$ROOT", "")
      });
    }
    console.log("result", result);
    return result;
  }

  private pushFlattenArrayRefsStage(pipeline: any[], breadcrumb: string) {
    const nodes = breadcrumb.split("[0]");
    const path = breadcrumb.replace(/\[0\]/g, "");
    const newTempFieldName = path.replace(/\./g, "_");
    const deepth = nodes.length - 1;
    const reduce = (deepth: number, actual: number = 1): any => ({
      $reduce: {
        input: deepth > actual ? reduce(deepth, actual + 1) : `$${path}._id`,
        initialValue: [] as any,
        in: { $concatArrays: ["$$value", "$$this"] }
      }
    });

    pipeline.push({
      $addFields: {
        [newTempFieldName]: deepth > 1 ? reduce(nodes.length - 1, 2) : `$${path}._id`
      }
    });

    return newTempFieldName;
  }

  private addArrayMap(key: string, item: any, rootVar: string, path: string): any {
    const currPath = [path, key].filter(p => !!p).join(".");
    const firstItem = Object.values(item[0])[0];
    const firstItemKey = Object.keys(item[0])[0];

    return {
      [key]: {
        $map: {
          input: `${rootVar}.${key}`,
          as: "original",
          in: Array.isArray(firstItem)
            ? {
                $mergeObjects: ["$$original", this.addArrayMap(firstItemKey, firstItem, "$$original", currPath)]
              }
            : this.addMergeObject(firstItemKey, firstItem, "$$original", currPath)
        }
      }
    };
  }

  private addMergeObject(key: string, item: any, pathToInitialObj: string, path: string): any {
    const currPath = `${path}.${key}`;
    const arrPath = `$${currPath.replace(/\./g, "_")}`;
    let seccondObj: any;

    if (item === true)
      seccondObj = {
        $arrayElemAt: [
          arrPath,
          {
            $indexOfArray: [arrPath, { $eq: ["$$CURRENT" + "._id", pathToInitialObj + "._id"] }]
          }
        ]
      };
    else if (Array.isArray(item))
      seccondObj = this.addArrayMap(Object.keys(item)[0], Object.values(item)[0], pathToInitialObj, currPath);
    else seccondObj = this.addMergeObject(Object.keys(item)[0], Object.values(item)[0], pathToInitialObj, currPath);

    return { $mergeObjects: [pathToInitialObj, { [key]: seccondObj }] };
  }
}
