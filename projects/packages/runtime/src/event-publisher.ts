import { EventEmitter } from 'node:events';
import type { EntityEvent } from '@poseidon/models';

export type EntityEventListener = (event: EntityEvent) => void;

export class EventPublisher {
    private readonly emitter = new EventEmitter();

    public publish(events: EntityEvent[]): void {
        events.forEach((event) => this.emitter.emit(event.type, event));
    }

    public subscribe(type: EntityEvent['type'], listener: EntityEventListener): () => void {
        this.emitter.on(type, listener);

        return () => this.emitter.off(type, listener);
    }
}
