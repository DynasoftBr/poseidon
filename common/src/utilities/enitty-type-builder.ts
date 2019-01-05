import { EntityType, EntityProperty } from "../models";
import { EntityPropertyBuilder } from "./entity-property-builder";

export class EntityTypeBuilder {

    entityType: EntityType;
    constructor() {
        this.entityType = <EntityType>{};
    }

    name(name: string) {
        this.entityType.name = name;
        return this;
    }

    label(label: string) {
        this.entityType.label = name;
        return this;
    }

    prop(propName: string) {
        const entityProp = <EntityProperty>{};
        entityProp.name = propName;

        return new EntityPropertyBuilder(entityProp);
    }
}