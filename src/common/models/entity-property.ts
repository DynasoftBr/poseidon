import { Validation } from "./";

export interface EntityProperty {
    _id: string;
    name: string;
    validation: Validation;
}