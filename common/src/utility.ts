
import { SimpleTypes } from "./constants";
import { EntityProperty } from "./models";

export class Utility {
    static isSimpleType(typeProp: string): boolean;
    static isSimpleType(typeProp: EntityProperty): boolean;
    static isSimpleType(typeProp: string | EntityProperty): boolean {
        return true;
    }
}

export type Partial<T> = {
    [P in keyof T]?: T[P];
};