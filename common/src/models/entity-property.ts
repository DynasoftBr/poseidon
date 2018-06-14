import { Entity, LinkedProperty, Validation } from "./";
import { PropertyTypes } from "../constants";

export interface EntityProperty {
    name: string;
    validation: Validation;
}