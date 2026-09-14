import { Link } from 'react-router-dom';
import Button from '@components/ui-button';
import Composer from '@components/portal-composer';
export default function Home({
    user,
    prompt,
    setPrompt,
    send,
}: {
    user?: { name: string };
    prompt: string;
    setPrompt: (value: string) => void;
    send: () => Promise<void>;
}) {
    const button = 'min-h-11 rounded-lg px-3 py-2 text-left hover:bg-selected';
    return (
        <>
            <h1 className="text-3xl md:text-4xl font-semibold mt-8 mb-3">
                Hello, {user?.name || 'there'}
            </h1>
            <p className="text-zinc-500 mb-8">What would you like to get done?</p>
            <Composer prompt={prompt} setPrompt={setPrompt} send={send} />
            <div className="grid md:grid-cols-2 gap-5 mt-8">
                <section className="rounded-2xl border border-zinc-500/20 p-6">
                    <h2 className="font-semibold mb-3">Build something that works for you</h2>
                    <p className="text-zinc-500 mb-4">
                        Turn your spreadsheet into a business tool.
                    </p>
                    <Button
                        variant="primary"
                        className={button}
                        onClick={() =>
                            setPrompt('Help me turn my spreadsheet into a business tool')
                        }
                    >
                        Get started ↗
                    </Button>
                </section>
                <section className="rounded-2xl border border-zinc-500/20 p-6">
                    <h2 className="font-semibold mb-3">Your next step</h2>
                    <p className="text-zinc-500">
                        Create the information and components your team needs.
                    </p>
                    <Link className={button + ' inline-block mt-4'} to="/entities">
                        Explore your platform →
                    </Link>
                </section>
            </div>
        </>
    );
}
