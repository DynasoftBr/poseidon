import { IConcreteEntity } from "@poseidon/core-models";
import { ComplexAbstractEntityType } from "./complex-abstract-entity-type";
import { ComplexLinkedEntityTypeRef } from "./references/complex-linked-entity-type-ref";

export interface FullEntityType extends IConcreteEntity {
    stringProp: string;
    intProp: number;
    numberProp: number;
    dateTimeProp: Date;
    booleanProp: boolean;
    arrayOfSimpleTypeProp: string[];
    arrayOfAbstractEntityProp: ComplexAbstractEntityType[];
    arrayOfLinkedEntityProp: ComplexLinkedEntityTypeRef[];
    abstractEntityProp: ComplexAbstractEntityType;
    linkedEntityProp: ComplexLinkedEntityTypeRef;
}