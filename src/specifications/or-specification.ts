import { Specification } from "./specificaiton";
import { ISpecification, IConcreteEntity, IOrSpecification } from "@poseidon/core-models";

export class OrSpecification<T extends IConcreteEntity = IConcreteEntity>
    extends Specification<T> implements IOrSpecification {

    conditions: ISpecification[];

    constructor() {
        super("", "");
    }

    async eval(fact: T): Promise<boolean> {
        for (const condition of this.conditions) {
            if (await condition.eval(fact))
                return true;
        }

        return false;
    }

}