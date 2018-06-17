import { AbstractEntity } from "./abstract-entity";

export interface Ref extends AbstractEntity {
    _id: string;
    name: string;
}