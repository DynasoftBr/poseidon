import type { EntityRef, PaginatedList } from '@poseidon/utilities';
import {
    captureRelationshipPath,
    resolveRelationshipDefinition,
    type RelationshipSelector,
} from '../model/relationship-metadata';

interface User {
    _id: string;
    createdTickets: PaginatedList<Ticket>;
}

interface Ticket {
    _id: string;
    assignment: {
        creator: EntityRef<User>;
    };
}

describe('relationship metadata', () => {
    it('should capture a nested inverse relationship path', () => {
        const path = captureRelationshipPath<Ticket>((ticket) => ticket.assignment.creator);

        expect(path).toEqual(['assignment', 'creator']);
    });

    it('should expose collection relationships as inverse endpoints', () => {
        const selector = (user: RelationshipSelector<User>) => user.createdTickets;

        expect(captureRelationshipPath(selector)).toEqual(['createdTickets']);
    });
});

import {
    Entity,
    EntityTypeDef,
    HasMany,
    HasOne,
    Property,
    Structure,
    definitionOf,
} from '../index';

@EntityTypeDef()
class RelationshipUser extends Entity {
    @HasMany(() => RelationshipTicket, (ticket) => ticket.creator)
    createdTickets!: PaginatedList<RelationshipTicket>;
}

@EntityTypeDef()
class RelationshipTicket extends Entity {
    @HasOne(() => RelationshipUser, (user) => user.createdTickets, { onDelete: 'detach' })
    creator!: EntityRef<RelationshipUser>;
}

describe('@HasOne and @HasMany', () => {
    it('should serialize reciprocal reference metadata', () => {
        const definition = definitionOf(RelationshipTicket);

        expect(definition.properties).toContainEqual({
            _id: 'relationship-ticket:creator',
            name: 'creator',
            type: 'reference',
            cardinality: 'one',
            onDelete: 'detach',
            targetEntityType: { _id: 'relationship-user' },
            inverseProperty: { _id: 'relationship-user:createdTickets' },
            inversePath: ['createdTickets'],
        });
    });

    it('should default reference deletion behavior to restrict', () => {
        const definition = definitionOf(RelationshipUser);

        expect(definition.properties).toContainEqual(
            expect.objectContaining({
                name: 'createdTickets',
                type: 'reference',
                cardinality: 'many',
                onDelete: 'restrict',
            }),
        );
    });
});

describe('relationship decorator validation', () => {
    it('should reject relationship metadata on unsupported members', () => {
        expect(() => {
            class InvalidRelationship {
                @HasOne(() => RelationshipTicket, (ticket) => ticket.creator)
                static relationship: EntityRef<RelationshipTicket> = { _id: '' };
            }
            return InvalidRelationship;
        }).toThrow('Entity properties must be named instance properties.');
    });

    it('should reject an empty inverse path', () => {
        const resolver: Parameters<typeof resolveRelationshipDefinition>[3] = {
            entityTypeOptionsOf: () => ({ name: 'relationship-ticket' }),
            propertiesOf: () => new Map(),
            relationshipsOf: () => new Map(),
        };

        expect(() =>
            resolveRelationshipDefinition(
                RelationshipTicket,
                'creator',
                { target: () => RelationshipTicket, inversePath: [] },
                resolver,
            ),
        ).toThrow('Relationship inverse paths cannot be empty.');
    });

    it('should reject a structure target', () => {
        @EntityTypeDef({ structure: true })
        class RelationshipStructure extends Entity {
            related!: EntityRef<StructureSource>;
        }
        @EntityTypeDef()
        class StructureSource extends Entity {
            @HasOne(() => RelationshipStructure, (structure) => structure.related)
            related!: EntityRef<RelationshipStructure>;
        }

        expect(() => definitionOf(StructureSource)).toThrow('must target an entity type');
    });

    it('should reject a non-relationship inverse property', () => {
        @EntityTypeDef()
        class MissingInverseTarget extends Entity {
            @Property({ type: 'reference' })
            related!: EntityRef<MissingInverseSource>;
        }
        @EntityTypeDef()
        class MissingInverseSource extends Entity {
            @HasOne(() => MissingInverseTarget, (target) => target.related)
            related!: EntityRef<MissingInverseTarget>;
        }

        expect(() => definitionOf(MissingInverseSource)).toThrow(
            'must select a reciprocal relationship property',
        );
    });

    it('should reject a relationship whose inverse targets another entity type', () => {
        @EntityTypeDef()
        class OtherEntity extends Entity {
            related!: EntityRef<MismatchedTarget>;
        }
        @EntityTypeDef()
        class MismatchedTarget extends Entity {
            @HasOne(() => OtherEntity, (other) => other.related)
            related!: EntityRef<OtherEntity>;
        }
        @EntityTypeDef()
        class MismatchedSource extends Entity {
            @HasOne(() => MismatchedTarget, (target) => target.related)
            related!: EntityRef<MismatchedTarget>;
        }

        expect(() => definitionOf(MismatchedSource)).toThrow('must be reciprocal');
    });

    it('should reject an inverse relationship that points to another property', () => {
        @EntityTypeDef()
        class WrongSource extends Entity {
            @HasOne(() => WrongTarget, (target) => target.related)
            first!: EntityRef<WrongTarget>;

            @Property({ type: 'reference' })
            second!: EntityRef<WrongTarget>;
        }
        @EntityTypeDef()
        class WrongTarget extends Entity {
            @HasOne(() => WrongSource, (source) => source.second)
            related!: EntityRef<WrongSource>;
        }

        expect(() => definitionOf(WrongSource)).toThrow(
            'must be selected by its reciprocal property',
        );
    });

    it('should reject nested inverse paths that are not declared structures', () => {
        @EntityTypeDef()
        class InvalidPathTarget extends Entity {
            @Property({ type: 'object' })
            assignment!: { creator: EntityRef<InvalidPathSource> };
        }
        @EntityTypeDef()
        class InvalidPathSource extends Entity {
            @HasOne(() => InvalidPathTarget, (target) => target.assignment.creator)
            related!: EntityRef<InvalidPathTarget>;
        }

        expect(() => definitionOf(InvalidPathSource)).toThrow('is not a declared nested property');
    });

    it('should resolve a nested inverse relationship property', () => {
        @EntityTypeDef({ structure: true })
        class Assignment extends Structure {
            @HasOne(() => NestedSource, (source) => source.related)
            creator!: EntityRef<NestedSource>;
        }
        @EntityTypeDef()
        class NestedTarget extends Entity {
            @Property({ type: 'object', itemsType: Assignment })
            assignment!: Assignment;
        }
        @EntityTypeDef()
        class NestedSource extends Entity {
            @HasOne(() => NestedTarget, (target) => target.assignment.creator)
            related!: EntityRef<NestedTarget>;
        }

        expect(definitionOf(NestedSource).properties).toContainEqual(
            expect.objectContaining({ name: 'related', inversePath: ['assignment', 'creator'] }),
        );
    });

    it('should reject symbols in an inverse selector', () => {
        expect(() =>
            captureRelationshipPath<RelationshipTicket>(
                (ticket) => Reflect.get(ticket, Symbol.iterator) as never,
            ),
        ).toThrow('Relationship paths require string property names.');
    });

    it('should reject an undeclared inverse property', () => {
        @EntityTypeDef()
        class UndeclaredTarget extends Entity {
            related!: EntityRef<UndeclaredSource>;
        }
        @EntityTypeDef()
        class UndeclaredSource extends Entity {
            @HasOne(() => UndeclaredTarget, (target) => target.related)
            related!: EntityRef<UndeclaredTarget>;
        }

        expect(() => definitionOf(UndeclaredSource)).toThrow('is not declared');
    });
});
