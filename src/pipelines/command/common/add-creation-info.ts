import { SysUsers, IUser } from "@poseidon/core-models";
import { ICommandRequest } from "../command-request";
import { PipelineItem } from "../../pipeline-item";

export async function AddCreationInfo(request: ICommandRequest, next: PipelineItem) {
  request.payload._createdAt = new Date();
  request.payload._createdBy = {
    _id: SysUsers.root
  } as IUser;

  return next(request);
}
