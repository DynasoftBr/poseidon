import { createContext, useContext, useState, type ReactNode } from 'react';
export interface FormState {
    values: Record<string, unknown>;
    errors: Record<string, string>;
    touched: Record<string, boolean>;
    dirty: boolean;
    submitting: boolean;
    setValue: (name: string, value: unknown) => void;
    submit: () => Promise<void>;
}
const FormContext = createContext<FormState | null>(null);
export function Form({
    initialValues,
    onSubmit,
    validate,
    children,
    derive,
}: {
    initialValues: Record<string, unknown>;
    onSubmit: (values: Record<string, unknown>) => Promise<void>;
    validate: (values: Record<string, unknown>) => Record<string, string>;
    children: ReactNode;
    derive?: (values: Record<string, unknown>) => Record<string, unknown>;
}) {
    const [values, setValues] = useState(initialValues);
    const [baseline, setBaseline] = useState(initialValues);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [submitting, setSubmitting] = useState(false);
    const computedValues = { ...values, ...derive?.(values) };
    const submit = async () => {
        const problems = validate(computedValues);
        setTouched(Object.fromEntries(Object.keys(values).map((name) => [name, true])));
        setErrors(problems);
        if (Object.keys(problems).length || submitting) return;
        setSubmitting(true);
        try {
            await onSubmit(computedValues);
            setBaseline(values);
        } catch (error) {
            setErrors(formErrors(error));
        } finally {
            setSubmitting(false);
        }
    };
    const state: FormState = {
        values: computedValues,
        errors,
        touched,
        submitting,
        dirty: JSON.stringify(values) !== JSON.stringify(baseline),
        submit,
        setValue: (name, value) => {
            setValues((current) => ({ ...current, [name]: value }));
            setTouched((current) => ({ ...current, [name]: true }));
        },
    };
    return (
        <FormContext.Provider value={state}>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void submit();
                }}
            >
                {children}
                {errors.form && <p role="alert">{errors.form}</p>}
            </form>
        </FormContext.Provider>
    );
}
export function useForm(): FormState {
    const form = useContext(FormContext);
    if (!form) throw new Error('Form fields must have a Form ancestor.');
    return form;
}

function formErrors(error: unknown): Record<string, string> {
    if (
        error &&
        typeof error === 'object' &&
        'problems' in error &&
        Array.isArray(error.problems) &&
        error.problems.length > 0
    ) {
        return Object.fromEntries(
            error.problems
                .filter(
                    (problem: unknown) =>
                        problem &&
                        typeof problem === 'object' &&
                        'property' in problem &&
                        'message' in problem,
                )
                .map((problem: { property: unknown; message: unknown }) => [
                    String(problem.property),
                    String(problem.message),
                ]),
        );
    }
    return { form: error instanceof Error ? error.message : 'Save failed.' };
}
