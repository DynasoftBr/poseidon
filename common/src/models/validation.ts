import { Entity } from "./entity";
import { Ref, LinkedProperty } from "./";
import { PropertyConvention, PropertyType } from "../constants";

export interface Validation {
    type: PropertyType;
    required: boolean;
    min: number;
    max: number;
    pattern: string;
    enum: any[];
    ref: Ref;
    linkedProperties: LinkedProperty[];
    items: Validation;
    uniqueItems: boolean;
    multipleOf: number;
    default: string;
    convention: PropertyConvention;
    base64Encoded: boolean;
}