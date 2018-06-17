import { Ref, LinkedProperty, AbstractEntity } from "./";
import { PropertyConvention, PropertyTypes } from "../constants";

export interface Validation extends AbstractEntity {
    type: PropertyTypes;
    required?: boolean;
    unique?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
    ref?: Ref;
    linkedProperties?: LinkedProperty[];
    items?: Validation;
    uniqueItems?: boolean;
    multipleOf?: number;
    default?: string;
    convention?: PropertyConvention;
    base64Encoded?: boolean;
}