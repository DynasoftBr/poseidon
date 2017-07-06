import { Entity } from "./entity";
import { PropertyType, Ref, LinkedProperty } from "./";
import { PropertyConvention } from "./constants";

export interface Validation {
    type: PropertyType;
    required: boolean;
    min: number;
    max: number;
    pattern: string;
    enum: any[];
    ref: Ref;
    linkedProperties: LinkedProperty;
    items: Validation;
    uniqueItems: boolean;
    multipleOf: number;
    default: any;
    convention: PropertyConvention;
}