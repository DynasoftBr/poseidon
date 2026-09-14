import { Badge, Button, Card, Field, Input, Switch } from './primitives';
export default { title: 'Poseidon/Foundation' };
export const Light = { render: () => <Showcase dark={false} /> };
export const Dark = { render: () => <Showcase dark /> };
function Showcase({ dark }: { dark: boolean }) {
    return (
        <div data-mode={dark ? 'dark' : 'light'} className="min-h-screen bg-canvas p-6 text-ink">
            <Card className="mx-auto grid max-w-xl gap-5">
                <h1 className="text-3xl font-semibold">Build and run your business with AI</h1>
                <p className="text-muted">Graphite and indigo · semantic tokens</p>
                <div className="flex flex-wrap gap-3">
                    <Button variant="primary">Ask Triton</Button> <Button>Configure</Button>
                    <Button disabled>Disabled</Button>
                    <Button loading>Save</Button>
                </div>
                <Badge>Example</Badge>
                <Field label="Name">
                    <Input placeholder="Your business tool" />
                </Field>
                <Field label="Required field" error="Enter a name.">
                    <Input aria-invalid />
                </Field>
                <Switch label="Dark mode" checked={dark} onChange={() => undefined} />
            </Card>
        </div>
    );
}
