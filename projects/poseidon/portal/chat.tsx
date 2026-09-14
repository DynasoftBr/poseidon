import Button from '@components/ui-button';
import Composer from '@components/portal-composer';
type Work = { title: string; steps: string[] };
export default function Chat({
    messages,
    prompt,
    setPrompt,
    send,
    work,
    setWork,
}: {
    messages: { role: string; text: string; work?: Work }[];
    prompt: string;
    setPrompt: (value: string) => void;
    send: () => Promise<void>;
    work?: Work;
    setWork: (value: Work | undefined) => void;
}) {
    return (
        <>
            <h1 className="text-2xl font-semibold mb-6">Triton</h1>
            <div className="min-h-[45vh] space-y-5 mb-8">
                {messages.length ? (
                    messages.map((message, index) => (
                        <article
                            key={index}
                            className={
                                'p-5 rounded-xl break-words ' +
                                (message.role === 'user'
                                    ? 'bg-indigo-500/10 ml-4 md:ml-20'
                                    : 'border border-zinc-500/20')
                            }
                        >
                            <p className="text-xs text-zinc-500 mb-2">
                                {message.role === 'user' ? 'You' : 'Triton · Simulated'}
                            </p>
                            {message.text}
                            {message.work && (
                                <Button
                                    variant="ghost"
                                    className="mt-3 block"
                                    onClick={() => setWork(message.work)}
                                >
                                    View example plan
                                </Button>
                            )}
                        </article>
                    ))
                ) : (
                    <p className="text-zinc-500">Ask Triton to find, do, or build something.</p>
                )}
            </div>
            <Composer prompt={prompt} setPrompt={setPrompt} send={send} />
            {work && (
                <aside aria-label="Work panel" className="border border-line rounded-xl p-5 mt-5">
                    <div className="flex justify-between items-center gap-3">
                        <h2 className="font-semibold">{work.title} · Simulated</h2>
                        <Button variant="ghost" onClick={() => setWork(undefined)}>
                            Close panel
                        </Button>
                    </div>
                    <ol className="list-decimal pl-5 mt-4 space-y-2">
                        {work.steps.map((step) => (
                            <li key={step}>{step}</li>
                        ))}
                    </ol>
                </aside>
            )}
        </>
    );
}
