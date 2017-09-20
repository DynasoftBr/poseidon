export interface Entity {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
    _version: number;

    [key: string]: any;
}