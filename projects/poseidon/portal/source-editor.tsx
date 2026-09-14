import { CodeEditor, type CodeEditorProps } from '@poseidon/editor';

export default function SourceEditor({
    fileId,
    value,
    files,
    onChange,
    line,
    saveState,
    status,
    problemsOpen,
    onProblemsOpenChange,
}: CodeEditorProps) {
    return (
        <CodeEditor
            fileId={fileId}
            value={value}
            files={files}
            onChange={onChange}
            line={line}
            saveState={saveState}
            status={status}
            problemsOpen={problemsOpen}
            onProblemsOpenChange={onProblemsOpenChange}
        />
    );
}
