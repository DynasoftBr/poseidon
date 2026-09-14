import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Form, useForm } from '@poseidon/ui-foundation';
function Fields() {
    const form = useForm();
    return (
        <label>
            Name
            <input
                value={String(form.values.name)}
                onChange={(event) => form.setValue('name', event.target.value)}
            />
            {form.errors.name && <span role="alert">{form.errors.name}</span>}
        </label>
    );
}
function Summary() {
    const form = useForm();
    return (
        <>
            <p>Greeting: {String(form.values.greeting)}</p>
            <p>{form.dirty ? 'Unsaved changes' : 'Saved'}</p>
            <button type="submit">Save</button>
        </>
    );
}
function Example() {
    const [step, setStep] = useState(1),
        [fail, setFail] = useState(true);
    return (
        <Form
            initialValues={{ name: '' }}
            derive={(values) => ({ greeting: 'Hello ' + String(values.name) })}
            validate={(values) => (values.name ? {} : { name: 'Enter a name' })}
            onSubmit={() =>
                fail
                    ? Promise.reject(
                          Object.assign(new Error('Version conflict. Your changes remain here.'), {
                              problems: [],
                          }),
                      )
                    : Promise.resolve()
            }
        >
            <button type="button" onClick={() => setStep(step === 1 ? 2 : 1)}>
                Change step
            </button>
            {step === 1 ? <Fields /> : <Summary />}
            <label>
                Simulate conflict
                <input
                    type="checkbox"
                    checked={fail}
                    onChange={(event) => setFail(event.target.checked)}
                />
            </label>
        </Form>
    );
}
createRoot(document.getElementById('root')!).render(<Example />);
