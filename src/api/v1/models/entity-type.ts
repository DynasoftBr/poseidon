import { Entity, EntityProperty } from "./";

export interface EntityType extends Entity {
    name: string;
    abstract: boolean;
    props: EntityProperty[];
}