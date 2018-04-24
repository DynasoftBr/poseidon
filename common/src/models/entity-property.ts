import { Entity, LinkedProperty, Validation } from "./";
import { PropertyType } from "../constants";

export interface EntityProperty {
    name: string;
    validation: Validation;
}