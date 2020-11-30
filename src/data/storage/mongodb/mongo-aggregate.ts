import { Queryable } from "../../../query-builder/queryable";

export interface MongoAggregate {
  $lookup?: MongoLookup;
  $replaceRoot?: { newRoot: string };
  $match?: MongoMatch;
  $project?: MongoProjection;
  $unwind?: string;
  $addFields?: any; 
}

export interface MongoLookup {
  let: { [key: string]: string };
  from: string;
  as: string;
  pipeline?: MongoAggregate[];
}

export interface MongoProjection {
  [key: string]: 1 | 0 | string;
}

export type MongoMatch = { [key: string]: MongoMatchOperator | any } & { $or?: MongoOrMatch[] };

export interface MongoOrMatch {
  $or?: MongoOrMatch[];
}

export interface MongoMatchOperator {
  $gt?: number;
  $lt?: number;
  $eq: any;
}
