import { Entity } from "./entity";
import { Ref, LinkedProperty } from "./";
import { PropertyConvention, PropertyTypes } from "../constants";
import { TruncateOptions } from "lodash";

export interface Validation {
    type: PropertyTypes;
    required?: boolean;
    unique?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
    ref?: Ref;
    linkedProperties?: LinkedProperty[];
    items?: Validation;
    uniqueItems?: boolean;
    multipleOf?: number;
    default?: string;
    convention?: PropertyConvention;
    base64Encoded?: boolean;
}