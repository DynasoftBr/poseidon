import { AbstractEntity } from "./abstract-entity";

export interface LinkedProperty extends AbstractEntity {
    name: string;
    label: string;
    keepUpToDate: boolean;
}