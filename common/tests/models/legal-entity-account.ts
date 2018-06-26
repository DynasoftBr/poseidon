import { AbstractEntity } from "../../src";
import { CommunicationChannel } from "./communication-channel";
import { BusinessLineRef, CustomerAccountRef } from "./references";

export interface LegalEntityAccount extends AbstractEntity {
    name: string;
    communicationChannel: CommunicationChannel[];
    businessLine: BusinessLineRef[];
    CustomerAccountReferences: CustomerAccountRef[];
}