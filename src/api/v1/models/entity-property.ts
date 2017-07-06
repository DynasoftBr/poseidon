import { Entity, LinkedProperty, LinkedEntity, Validation } from "./";
import { PropertyType } from "./constants";

export interface EntityProperty {
    name: string;
    validation: Validation;
}