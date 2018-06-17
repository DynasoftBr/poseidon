import { EntityProperty, ConcreteEntity } from "./";

export interface EntityType extends ConcreteEntity {
    name: string;
    label?: string;
    abstract?: boolean;
    props: EntityProperty[];
    beforeValidation?: string;
    validating?: string;
    beforeSave?: string;
    afterSave?: string;
}