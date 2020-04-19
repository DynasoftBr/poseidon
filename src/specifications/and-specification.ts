import { Specification } from "./specificaiton";
import { IAndSpecification, ISpecification, IEntity } from "@poseidon/core-models";

export class AndSpecification<T extends IEntity = IEntity>
    extends Specification<T> implements IAndSpecification {

    conditions: ISpecification[];

    constructor() {
        super("", "");
    }

    async eval(fact: T): Promise<boolean> {
        for (const condition of this.conditions) {
            if (!(await condition.eval(fact)))
                return false;
        }

        return true;
    }

}