import { ConcreteEntity } from "../../src";
import { LegalEntityAccount } from "./legal-entity-account";
import { CountryRef } from "./references/country-ref";

export interface LegalEntity extends ConcreteEntity {
    name: string;
    age: number;
    gender: string;
    dateOfBirth: Date;
    isActive: boolean;
    roles: ("client" | "company")[];
    accounts: LegalEntityAccount[];
    country: CountryRef;
}