import { Entity, EntityProperty } from "./";

export interface EntityType extends Entity {
    name: string;
    abstract: boolean;
    props: EntityProperty[];
    beforeValidation?: string;
    validating?: string;
    beforeSave?: string;
    afterSave?: string;
}