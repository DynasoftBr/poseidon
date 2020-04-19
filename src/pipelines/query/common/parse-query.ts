import { IQueryRequest } from "../query-request";
import { PipelineItem } from "../../pipeline-item";
import { IEntityType, IEntityProperty, PropertyTypes, SysProperties } from "@poseidon/core-models/src";
import { IRepository } from "../../../data";
import { DatabaseError, SysMsgs } from "../../../exceptions";
import _ = require("lodash");
import { PoseidonToMongoDbQueryInterpreter } from "../interpreter/poseidon-to-mongodb-query-interpreter";

export async function parseQuery(request: IQueryRequest, next: PipelineItem) {
  try {
    const etTypeRepo = await request.repoFactory.entityType();
    const interpreter = new PoseidonToMongoDbQueryInterpreter(etTypeRepo, request.entityType, request.query);
    console.log(JSON.stringify(await interpreter.interpret()));

    // request.query = await buildEntityQuery(request.entityType, etTypeRepo, request.query);
    // console.log(JSON.stringify(request.query));
  } catch (error) {
    console.log(error);
    return (request.response = {
      error: new DatabaseError(SysMsgs.error.queryParseError)
    });
  }

  return await next(request);
}

// async function buildEntityQuery(
//   entityType: IEntityType,
//   etTypeRepo: IRepository<IEntityType>,
//   query: any,
//   variableCounter: number = 0,
//   path: string = ""
// ) {
//   const result: any[] = [];

//   if (query.$match != null) result.push({ $match: query.$match });

//   for (const key in query.$include) {
//     console.log("including", key);
//     result.push(...(await addLookup(key, query.$include[key], entityType, etTypeRepo, variableCounter++)));
//   }

//   return result;
// }

// async function addLookup(
//   field: string,
//   query: any,
//   entityType: IEntityType,
//   entityTypeRepo: IRepository<IEntityType>,
//   variableCounter: number
// ) {
//   let prop: IEntityProperty;
//   const splittedKeys = field.split(".");
//   const lastIdx = splittedKeys.length - 1;
//   let parentProp: IEntityProperty;
//   const breadcrumbArr = [];
//   let anyArray = false;
//   const result = [];

//   for (const [idx, k] of splittedKeys.entries()) {
//     prop = entityType.props.find(p => p.name === k);
//     console.log(entityType.name, k);
//     const { type, items, ref } = prop.validation;
//     const isNestedProp = splittedKeys.length > 1;
//     const isAbstractEntityProp =
//       type === PropertyTypes.abstractEntity || (type === PropertyTypes.array && items.type === PropertyTypes.abstractEntity);
//     const relatedEtId = type === PropertyTypes.array ? items.ref._id : ref._id;

//     entityType = await entityTypeRepo.findById(relatedEtId);

//     breadcrumbArr.push(type === PropertyTypes.array ? `${prop.name}[0]` : `${prop.name}`);
//     if (isNestedProp && !isAbstractEntityProp && idx < lastIdx) {
//       throw "When using nested props each one should be";
//     } else if (isNestedProp && idx < lastIdx) {
//       parentProp = prop;
//       anyArray = anyArray || type === PropertyTypes.array;
//       continue;
//     }

//     const isValidRelation =
//       type === PropertyTypes.linkedEntity ||
//       (type === PropertyTypes.array && (items.type === "reverseRelation" || items.type === PropertyTypes.linkedEntity));

//     // Check the valid property types that can be included.
//     if (!isValidRelation) throw "Invalid relation";

//     const isReverse = items && items.type === "reverseRelation";
//     const relatedEntity = await entityTypeRepo.findById(relatedEtId);

//     if (relatedEntity == null) throw "Invalid linked entity";

//     const subPipeline = await buildEntityQuery(relatedEntity, entityTypeRepo, query, variableCounter++, field);

//     let foreignKey: string;
//     let relatedProp: string;

//     if (!isReverse) {
//       foreignKey = `${field}._id`;
//       relatedProp = "$_id";
//     } else {
//       foreignKey = "_id";
//       relatedProp = `$${items.reverseProp}._id`;
//     }

//     const variable = `var_${variableCounter}`;
//     const breadcrumb = breadcrumbArr.join(".");
//     let asParam: string;
//     let letSt: any;

//     // add the query to the beggining of the pipeline.
//     if (!anyArray) {
//       subPipeline.unshift({ $match: { $expr: { $eq: [relatedProp, "$$" + variable] } } });
//       asParam = field;
//       letSt = { [variable]: "$" + foreignKey };
//     } else {
//       subPipeline.unshift({ $match: { $expr: { $in: [relatedProp, "$$" + variable] } } });
//       asParam = pushFlattenArrayRefsStage(result, breadcrumb);
//       letSt = { [variable]: "$" + asParam };
//     }

//     result.push({
//       $lookup: {
//         from: relatedEntity.name,
//         let: letSt,
//         pipeline: subPipeline,
//         as: asParam
//       }
//     });

//     if (anyArray) {
//       var objToset = _.set({}, breadcrumb, true);
//       console.log("adding", JSON.stringify(objToset));
//       result.push(add(objToset));
//     }

//     if (type !== PropertyTypes.array) {
//       result.push({ $unwind: { path: `\$${field}`, preserveNullAndEmptyArrays: true } });
//     }
//   }

//   return result;
// }

// function add(obj: any) {
//   var result = {
//     $addFields: Array.isArray(obj[Object.keys(obj)[0]])
//       ? addArray(obj, "$$ROOT", "")
//       : addObject(obj[Object.keys(obj)[0]], "$$ROOT", "")
//   };
//   return result;
// }

// function addObject(obj: any, originalVar: string, path: string) {
//   console.log("merging", ...arguments);
//   if (obj[Object.keys(obj)[0]] === true) {
//     return {
//       $mergeObjects: [
//         `${originalVar}`,
//         {
//           [Object.keys(obj)[0]]: {
//             $arrayElemAt: [
//               `$${`${path}.${Object.keys(obj)[0]}`.replace(".", "_")}`,
//               {
//                 $indexOfArray: [
//                   `$${`${path}.${Object.keys(obj)[0]}`.replace(".", "_")}`,
//                   {
//                     $eq: ["$$CURRENT", `${originalVar}`]
//                   }
//                 ]
//               }
//             ]
//           }
//         }
//       ]
//     };
//   } else {
//     return {
//       $mergeObjects: [
//         `${originalVar}`,
//         {
//           [Object.keys(obj)[0]]: {
//             $arrayElemAt: [
//               `$${`${path}.${Object.keys(obj)[0]}`.replace(".", "_")}`,
//               {
//                 $indexOfArray: [
//                   `$${`${path}.${Object.keys(obj)[0]}`.replace(".", "_")}`,
//                   {
//                     $eq: ["$$CURRENT", `${originalVar}`]
//                   }
//                 ]
//               }
//             ]
//           }
//         }
//       ]
//     };
//   }
// }

// function addArray(obj: any, rootVar: string, path: string): any {
//   path = [path, Object.keys(obj)[0]].filter(p => !!p).join(".");
//   path = path ? `${path}.` : "";

//   const addMerge = (originalVar: string) => {
//     const key = Object.keys(obj)[0];
//     return {
//       $mergeObjects: [
//         `${originalVar}`,
//         {
//           [key]: {
//             $arrayElemAt: [
//               `$${`${path}${key}`}`,
//               {
//                 $indexOfArray: [`$${`${path}${key}`}`, { $eq: ["$$CURRENT", `${originalVar}`] }]
//               }
//             ]
//           }
//         }
//       ]
//     };
//   };

//   return {
//     [Object.keys(obj)[0]]: {
//       $map: {
//         input: `${rootVar}.${Object.keys(obj)[0]}`,
//         as: "original",
//         in: Array.isArray(obj[Object.keys(obj)[0]][0])
//           ? addArray(obj[Object.keys(obj)[0]], "$$original", path)
//           : addObject(obj[Object.keys(obj)[0]][0], "$$original", path)
//       }
//     }
//   };
// }

// function pushFlattenArrayRefsStage(pipeline: any[], breadcrumb: string) {
//   const nodes = breadcrumb.split("[0]");
//   const path = breadcrumb.replace(/\[0\]/g, "");

//   const reduce = (deepth: number, actual: number = 1): any => ({
//     $reduce: {
//       input: deepth > actual ? reduce(deepth, actual + 1) : `$${path}._id`,
//       initialValue: [] as any,
//       in: { $concatArrays: ["$$value", "$$this"] }
//     }
//   });

//   const newTempFieldName = path.replace(/\./g, "_");
//   const deepth = nodes.length - 1;
//   pipeline.push({
//     $addFields: {
//       [newTempFieldName]: deepth > 1 ? reduce(nodes.length - 1, 2) : `$${path}._id`
//     }
//   });

//   return newTempFieldName;
// }
