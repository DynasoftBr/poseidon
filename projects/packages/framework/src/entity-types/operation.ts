import { Property } from '../model/decorators';
import { Entity } from './entity';

/** Base declaration shared by actions and queries. */
export class Operation extends Entity {
    /** Name used to invoke this operation. */
    @Property({ type: 'string', required: true, description: 'Name of the operation to execute.' })
    name!: string;

    /** Display name of this operation. */
    @Property({ type: 'string', required: true, description: 'Display name of the operation.' })
    label!: string;

    /** Explains what this operation does. */
    @Property({ type: 'string', required: true, description: 'Explains what the operation does.' })
    description!: string;

    /** Permissions available while this operation runs. */
    @Property({
        type: 'array',
        itemsType: 'string',
        required: true,
        description: 'Permissions available while the operation runs.',
    })
    permissions!: string[];

    /** Whether this operation runs when invoked. */
    @Property({ type: 'boolean', required: true, description: 'Whether the operation runs.' })
    enabled!: boolean;
}
