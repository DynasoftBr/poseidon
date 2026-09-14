import type { Expression } from './expression';
import type { ValueSchema } from './value-schema';

export interface FormDefinition {
    fields: Record<string, ValueSchema>;
    validations: { field: string; condition: Expression; message: string }[];
    derived: Record<string, Expression>;
    entities: {
        entityTypeId: string;
        id: Expression;
        expectedVersion?: Expression;
        values: Record<string, Expression>;
    }[];
}
