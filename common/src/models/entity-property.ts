import { Validation, AbstractEntity } from ".";

export interface EntityProperty extends AbstractEntity {
    name: string;
    validation: Validation;
}