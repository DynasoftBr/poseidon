import type { EntityRef, PaginatedList } from '@poseidon/utilities';
import { propertiesOf, relationshipsOf, requiredMetadata } from './decorator-metadata';
import type {
    DecoratedRelationshipMetadata,
    EntityClass,
    PropertyOptions,
    RelationshipOptions,
} from './decorator-types';
import {
    captureRelationshipPath,
    type RelationshipPath,
    type RelationshipSelector,
} from './relationship-metadata';

type FieldContext<This, Value> = ClassFieldDecoratorContext<This, Value>;
type RelationshipField<T extends { _id: string }> = EntityRef<T> | PaginatedList<T>;
type RelationshipRegistration<TTarget extends { _id: string }> = {
    target: () => EntityClass<TTarget>;
    inverse: (selector: RelationshipSelector<TTarget>) => RelationshipPath;
    cardinality: 'one' | 'many';
    options: RelationshipOptions;
};

/** Declares a string-named instance property with an explicit type. */
export function Property(options: PropertyOptions) {
    return <This>(_: undefined, context: FieldContext<This, unknown>): void => {
        registerField(context, options);
    };
}

export function HasOne<TTarget extends { _id: string }>(
    target: () => EntityClass<TTarget>,
    inverse: (selector: RelationshipSelector<TTarget>) => RelationshipPath,
    options: RelationshipOptions = {},
) {
    return <This, Value extends EntityRef<TTarget>>(
        _: undefined,
        context: FieldContext<This, Value>,
    ): void => {
        registerRelationship(context, { target, inverse, cardinality: 'one', options });
    };
}

export function HasMany<TTarget extends { _id: string }>(
    target: () => EntityClass<TTarget>,
    inverse: (selector: RelationshipSelector<TTarget>) => RelationshipPath,
    options: RelationshipOptions = {},
) {
    return <This, Value extends PaginatedList<TTarget>>(
        _: undefined,
        context: FieldContext<This, Value>,
    ): void => {
        registerRelationship(context, { target, inverse, cardinality: 'many', options });
    };
}

function registerField<This, Value>(
    context: FieldContext<This, Value>,
    options: PropertyOptions,
): string {
    const name = fieldNameOf(context);
    propertiesOf(requiredMetadata(context.metadata)).set(name, options);
    relationshipsOf(requiredMetadata(context.metadata)).delete(name);
    return name;
}

function registerRelationship<This, TTarget extends { _id: string }>(
    context: FieldContext<This, RelationshipField<TTarget>>,
    registration: RelationshipRegistration<TTarget>,
): void {
    const onDelete = registration.options.onDelete ?? 'restrict';
    const name = registerField(context, {
        type: 'reference',
        cardinality: registration.cardinality,
        onDelete,
    });
    const relationship: DecoratedRelationshipMetadata = {
        ...registration.options,
        onDelete,
        target: registration.target,
        inversePath: captureRelationshipPath(registration.inverse),
    };
    relationshipsOf(requiredMetadata(context.metadata)).set(name, relationship);
}

function fieldNameOf<This, Value>(context: FieldContext<This, Value>): string {
    if (context.static || context.private || typeof context.name !== 'string') {
        throw new Error('Entity properties must be named instance properties.');
    }
    return context.name;
}
