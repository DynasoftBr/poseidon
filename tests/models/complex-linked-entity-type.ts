import { IConcreteEntity } from "@poseidon/core-models";
import { SimpleAbstractEntityType } from "./simple-abstract-entity-type";
import { SimpleLinkedEntityTypeRef } from "./references/simple-linked-entity-type-ref";

export interface ComplexLinkedEntityType extends IConcreteEntity {
    stringProp: string;
    intProp: number;
    numberProp: number;
    dateTimeProp: Date;
    booleanProp: boolean;
    arrayOfSimpleTypeProp: string[];
    arrayOfAbstractEntityProp: SimpleAbstractEntityType[];
    arrayOfLinkedEntityProp: SimpleLinkedEntityTypeRef[];
    abstractEntityProp: SimpleAbstractEntityType;
    linkedEntityProp: SimpleLinkedEntityTypeRef;
}