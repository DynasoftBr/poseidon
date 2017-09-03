import { Entity } from "./entity";
export interface User extends Entity {
    login: string;
    pass: string;
}
