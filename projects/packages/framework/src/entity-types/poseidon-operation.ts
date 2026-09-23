import type { EntityId } from './entity';
import { Structure } from './structure';

/** Base declaration shared by actions and queries. */
export class PoseidonOperation extends Structure {
    /** Identifier of this operation within its parent definition. */
    id!: EntityId;

    /** Name used to invoke this operation. */
    name!: string;

    /** Display name of this operation. */
    label!: string;

    /** Explains what this operation does. */
    description!: string;

    /** Whether this operation runs when invoked. */
    enabled!: boolean;
}
