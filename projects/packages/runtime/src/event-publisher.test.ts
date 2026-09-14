import { entityEventTypes, type EntityEvent } from '@poseidon/models';
import { EventPublisher } from './event-publisher';

describe('EventPublisher', () => {
    it('should publish committed events to subscribers', () => {
        const publisher = new EventPublisher();
        const listener = vi.fn();
        const event = createEvent();

        publisher.subscribe(entityEventTypes.created, listener);
        publisher.publish([event]);

        expect(listener).toHaveBeenCalledWith(event);
    });
});

function createEvent(): EntityEvent {
    return {
        id: 'event-1',
        type: entityEventTypes.created,
        entityTypeId: 'user',
        entityId: 'user-1',
        data: {},
        occurredAt: new Date(),
        actorId: 'system',
    };
}
