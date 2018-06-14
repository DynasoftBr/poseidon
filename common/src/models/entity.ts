import { UserRef } from "./helpers/user-ref";

export interface Entity {
    _id: string;
    created_at: Date;
    updated_at?: Date;
    created_by: UserRef;
    updated_by?: UserRef;

    [key: string]: any;
}