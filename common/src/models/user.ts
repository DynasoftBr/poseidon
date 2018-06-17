import { Entity } from "./entity";
import { ConcreteEntity } from "./concrete-entity";

export interface User extends ConcreteEntity {
    name: string;
    login: string;
    pass: string;
}