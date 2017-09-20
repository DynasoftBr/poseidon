
import { SimpleTypes } from "./models/constants/simple-types";
import { EntityProperty } from "./models";

export class Utility {
    static isSimpleType(typeProp: string): boolean;
    static isSimpleType(typeProp: EntityProperty): boolean;
    static isSimpleType(typeProp: string | EntityProperty): boolean {
        return true;
    }
}
