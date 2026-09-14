import { useState } from 'react';
import { Button, Dialog, Select, Feedback, Panel, Table, Icon } from './primitives';
export default { title: 'Poseidon/Interactions' };
function Example() {
    const [open, setOpen] = useState(false);
    return (
        <main className="min-h-screen bg-canvas text-ink p-4 sm:p-8 space-y-5">
            <Panel title="Controls">
                <div className="flex flex-wrap gap-3">
                    <Button onClick={() => setOpen(true)}>
                        <Icon name="plus" />
                        Open dialog
                    </Button>
                    <Select aria-label="View">
                        <option>All records</option>
                        <option>Recently updated</option>
                    </Select>
                </div>
            </Panel>
            <Feedback kind="error">
                The record changed while you were editing; your draft is preserved.
            </Feedback>
            <Table label="Example records">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Owner</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>A deliberately long record name to check contained scrolling</td>
                        <td>Active</td>
                        <td>Local user</td>
                    </tr>
                </tbody>
            </Table>
            <Dialog open={open} title="Create a record" onClose={() => setOpen(false)}>
                <p>Dialog focus stays inside while open.</p>
                <Button onClick={() => setOpen(false)}>Done</Button>
            </Dialog>
        </main>
    );
}
export const Controls = { render: () => <Example /> };
export const Dark = {
    render: () => (
        <div data-mode="dark">
            <Example />
        </div>
    ),
};
