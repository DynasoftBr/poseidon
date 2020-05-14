import { ICommandRequest } from "../command-request";
import { PipelineItem } from "../../pipeline-item";
import { v4 as uuidv4 } from "uuid";

export async function AssignIdentity(request: ICommandRequest, next: PipelineItem) {
  request.payload._id = request.payload._id || uuidv4();

  return next(request);
}
