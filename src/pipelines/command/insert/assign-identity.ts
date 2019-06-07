import { IConcreteEntity } from "@poseidon/core-models";
import { ObjectID } from "bson";
import { ICommandRequest } from "../command-request";

export async function AssignIdentity<T extends IConcreteEntity>(
    params: ICommandRequest<T>) {

    params.entity._id = params.entity._id || new ObjectID().toHexString();
}