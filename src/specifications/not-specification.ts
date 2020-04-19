import { Specification } from "./specificaiton";
import { IAndSpecification, ISpecification, IEntity, INotSpecification } from "@poseidon/core-models";

export class NotSpecification<T extends IEntity = IEntity>
    extends Specification<T> implements INotSpecification {

    condition: ISpecification;

    constructor() {
        super("", "");
    }

    async eval(fact: T): Promise<boolean> {
        return !(await this.condition.eval(fact));
    }

}