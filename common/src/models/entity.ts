export interface Entity {
    _id: string;
    created_at: Date;
    updated_at: Date;
    created_by: string;
    updated_by: string;

    [key: string]: any;
}