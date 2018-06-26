import { AbstractEntity } from "../../src";

export interface CommunicationChannel extends AbstractEntity {
    email: string;
    type: "personal" | "business";
}