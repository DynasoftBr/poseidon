import { ConcreteEntity } from "../../src";

export interface Country extends ConcreteEntity {
    name: string;
    code: string;
}