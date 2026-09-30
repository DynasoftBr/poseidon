import { requiredMetadata, setEntityOptions } from './decorator-metadata';
import type { EntityTypeOptions } from './decorator-types';

/**
 * Declares an entity class. Each registered class needs its own decorator.
 * @param {EntityTypeOptions} options - {@link EntityTypeOptions} to register.
 * @returns Decorator that registers the entity options.
 */
export function EntityTypeDef(options: EntityTypeOptions = {}) {
    return <T extends abstract new (...args: never[]) => object>(
        _target: T,
        context: ClassDecoratorContext<T>,
    ): void => {
        setEntityOptions(requiredMetadata(context.metadata), options);
    };
}
