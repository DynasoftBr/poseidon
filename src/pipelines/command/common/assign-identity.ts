import { IEntity } from "@poseidon/core-models";
import { ObjectID } from "bson";
import { ICommandRequest } from "../command-request";
import { PipelineItem } from "../../pipeline-item";

export async function AssignIdentity(request: ICommandRequest, next: PipelineItem) {
  request.payload._id = request.payload._id || new ObjectID().toHexString();

  return next(request);
}

export default function Teste(request: ICommandRequest, next: PipelineItem) {
  request.payload._id = request.payload._id || new ObjectID().toHexString();

  return next(request);
}