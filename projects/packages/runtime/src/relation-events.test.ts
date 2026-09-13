import { entityEventTypes, type EntityEvent, type EntityProperty } from '@poseidon/model';
import { createRelationEvents, deleteRelationEvents } from './relation-events';

describe('relation events', () => {
    const patient = property('appointment:patient', 'patient', 'patient:appointments');
    const appointments = property('patient:appointments', 'appointments');
    const source = event();

    it('should create links for new values and their configured inverse', () => {
        expect(
            createRelationEvents(
                source,
                [patient],
                { patient: 'patient:ada' },
                { reverseProperties: new Map([[appointments.id, appointments]]) },
            ),
        ).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: entityEventTypes.created,
                    data: {
                        relationPropertyId: patient.id,
                        thisId: 'appointment:1',
                        thatId: 'patient:ada',
                    },
                }),
                expect.objectContaining({
                    type: entityEventTypes.created,
                    data: {
                        relationPropertyId: appointments.id,
                        thisId: 'patient:ada',
                        thatId: 'appointment:1',
                    },
                }),
            ]),
        );
    });

    it('should preserve retained links and delete removed values with their inverse', () => {
        const reverseProperties = new Map([[appointments.id, appointments]]);
        expect(
            createRelationEvents(
                source,
                [patient],
                { patient: 'patient:ada' },
                {
                    previousData: { patient: 'patient:ada' },
                    reverseProperties,
                },
            ),
        ).toEqual([]);

        const deleted = deleteRelationEvents(
            source,
            [patient],
            { patient: ['patient:ada', 'patient:grace'] },
            { retainedData: { patient: 'patient:grace' }, reverseProperties },
        );
        expect(deleted).toHaveLength(2);
        expect(deleted.map(({ data }) => data)).toEqual(
            expect.arrayContaining([
                { relationPropertyId: patient.id, thisId: 'appointment:1', thatId: 'patient:ada' },
                {
                    relationPropertyId: appointments.id,
                    thisId: 'patient:ada',
                    thatId: 'appointment:1',
                },
            ]),
        );
    });

    it('should ignore non-reference values', () => {
        expect(createRelationEvents(source, [patient], { patient: 42 })).toEqual([]);
    });
});

function property(id: string, name: string, reversePropertyId?: string): EntityProperty {
    return {
        id,
        entityTypeId: 'appointment',
        name,
        type: 'reference',
        relatedEntityTypeId: 'patient',
        relationKind: 'has-many',
        reversePropertyId,
        createdAt: new Date(),
        createdById: 'system',
    };
}

function event(): EntityEvent {
    return {
        id: 'appointment-created',
        type: entityEventTypes.created,
        entityTypeId: 'appointment',
        entityId: 'appointment:1',
        data: {},
        actorId: 'system',
        occurredAt: new Date(),
    };
}
