export interface Condition { readonly condition: true }
export function setting<T>(name: string): T {
    throw new Error(`Compilation prototype: setting ${name} is resolved by the runtime.`);
}
export function specification<T>() {
    return {
        field<K extends keyof T>(_field: K) {
            return {
                greaterThan(_value: T[K]): Condition { return { condition: true }; },
                equals(_value: T[K]): Condition { return { condition: true }; },
            };
        },
    };
}
export class Pipeline<T, Results = Record<never, never>> {
    step<Name extends string, F extends (...args: never[]) => unknown>(
        _name: Name extends keyof Results ? never : Name,
        _step: {
            action: () => F;
            input: (context: { input: T; results: Results }) => Parameters<F>[0];
        },
    ): Pipeline<T, Results & Record<Name, Awaited<ReturnType<F>>>> {
        return new Pipeline<T, Results & Record<Name, Awaited<ReturnType<F>>>>();
    }
}
export function pipeline<T>() { return new Pipeline<T>(); }
export function defineBusinessRule<T>(definition: {
    label: string;
    description: string;
    when: Condition;
    then: Pipeline<T, unknown>;
}) { return definition; }
