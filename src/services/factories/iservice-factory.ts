import { IService } from "../iservice";
import { IConcreteEntity } from "@poseidon/core-models";

export interface IServiceFactory {
    getByName<T extends IConcreteEntity = IConcreteEntity>(entityTypeName: string): Promise<IService<T>>;
}