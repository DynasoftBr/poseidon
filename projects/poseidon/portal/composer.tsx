import Button from '@components/ui-button';
export default function Composer({
    prompt,
    setPrompt,
    send,
}: {
    prompt: string;
    setPrompt: (value: string) => void;
    send: () => Promise<void>;
}) {
    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                void send();
            }}
            className="flex items-end gap-2 border border-zinc-500/30 rounded-2xl p-3"
        >
            <textarea
                aria-label="Message Triton"
                placeholder="Ask Triton to find, do, or build something"
                className="bg-transparent resize-y min-h-16 w-full outline-none p-2"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
            />
            <Button
                variant="primary"
                type="submit"
                aria-label="Send message"
                className="bg-indigo-500 text-white rounded-xl min-w-11 min-h-11 disabled:opacity-40"
                disabled={!prompt.trim()}
            >
                ↑
            </Button>
        </form>
    );
}
