import { EntityProperty } from "../models";
import { PropertyTypes } from "../constants";

export class EntityPropertyBuilder {


    constructor(private entityProperty: EntityProperty) {
    }

    type(type: PropertyTypes) {
        this.entityProperty.validation = { type: type };
        return this;
    }

    required(required: boolean = true) {
        this.entityProperty.validation.required = required;
        return this;
    }

    min(min: number) {
        this.entityProperty.validation.min = min;
        return this;
    }

    max(max: number) {
        this.entityProperty.validation.max = max;
        return this;
    }

    pattern(pattern: string) {
        this.entityProperty.validation.pattern = pattern;
        return this;
    }
}