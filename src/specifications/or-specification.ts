import { Specification } from "./specificaiton";
import { ISpecification, Entity, IOrSpecification } from "@poseidon/core-models";

export class OrSpecification<T extends Entity = Entity>
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