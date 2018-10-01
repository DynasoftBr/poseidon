import { SimpleAbstractEntityType } from "../simple-abstract-entity-type";
import { SimpleLinkedEntityTypeRef } from "./simple-linked-entity-type-ref";

export interface ComplexLinkedEntityTypeRef {
    _id: string;
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