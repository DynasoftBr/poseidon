import { requiredMetadata } from '../model/decorator-metadata';
import { definitionOf, Property } from '../model/decorators';

describe('decorator metadata', () => {
    it('should reject unavailable standard decorator metadata', () => {
        expect(() => requiredMetadata(undefined)).toThrow(
            'Standard decorator metadata is unavailable.',
        );
    });

    it('should reject resolving a class without entity type metadata', () => {
        class Customer {
            @Property({ type: 'string' })
            name!: string;
        }

        expect(() => definitionOf(Customer)).toThrow('Customer must declare @EntityTypeDef().');
    });
});
