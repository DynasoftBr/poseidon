import { ISpecification, IConcreteEntity } from "@poseidon/core-models";

export abstract class Specification<T extends IConcreteEntity = IConcreteEntity>
    implements ISpecification<T> {

    abstract async eval(fact: T): Promise<boolean>;

    constructor(
        public discriminator: string,
        public description: string) {
    }
}