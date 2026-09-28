import type { EntityRef, PaginatedList } from '@poseidon/utilities';
import { captureRelationshipPath, type RelationshipSelector } from '../model/relationship-metadata';

interface User {
    _id: string;
    createdTickets: AsyncIterable<Ticket>;
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

import { Entity, EntityTypeDef, References, definitionOf } from '../index';

@EntityTypeDef()
class RelationshipUser extends Entity {
    @References(() => RelationshipTicket, (ticket) => ticket.creator, { cardinality: 'many' })
    createdTickets!: PaginatedList<RelationshipTicket>;
}

@EntityTypeDef()
class RelationshipTicket extends Entity {
    @References(() => RelationshipUser, (user) => user.createdTickets, {
        cardinality: 'one',
        onDelete: 'detach',
    })
    creator!: EntityRef<RelationshipUser>;
}

describe('@References', () => {
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
