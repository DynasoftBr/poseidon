import { IConcreteEntity, SysUsers } from "@poseidon/core-models";
import { ICommandRequest } from "../command-request";

export async function AddCreationInfo<T extends IConcreteEntity>(
    params: ICommandRequest<T>) {

    params.entity.createdAt = new Date();
    params.entity.createdBy = {
        _id: SysUsers.root,
        name: SysUsers.root
    };
}