import type { ReactElement, ReactNode } from 'react';
export interface EditorFile {
    id: string;
    code: string;
}
export interface CodeEditorProps {
    fileId: string;
    value: string;
    files: EditorFile[];
    onChange: (value: string) => void;
    line?: number;
    saveState?: { state: 'saving' | 'saved' | 'error'; message?: string };
    status?: ReactNode;
    problemsOpen?: boolean;
    onProblemsOpenChange?: (open: boolean) => void;
}
export declare function CodeEditor(props: CodeEditorProps): ReactElement;
