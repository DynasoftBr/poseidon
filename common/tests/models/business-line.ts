import { ConcreteEntity } from "../../src";

export interface BusinessLine extends ConcreteEntity {
    name: string;
    description: string;
}