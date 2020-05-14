import { Specification } from "./specificaiton";
import { IAndSpecification, ISpecification, Entity, INotSpecification } from "@poseidon/core-models";

export class NotSpecification<T extends Entity = Entity>
    extends Specification<T> implements INotSpecification {

    condition: ISpecification;

    constructor() {
        super("", "");
    }

    async eval(fact: T): Promise<boolean> {
        return !(await this.condition.eval(fact));
    }

}