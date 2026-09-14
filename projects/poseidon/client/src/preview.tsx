import { useEffect, useRef } from 'react';
export function Preview({
    artifactId,
    props,
    onClose,
}: {
    artifactId: string;
    props: Record<string, unknown>;
    onClose: () => void;
}) {
    const frame = useRef<HTMLIFrameElement>(null);
    useEffect(() => {
        let channel: MessageChannel | undefined;
        const receive = (event: MessageEvent) => {
            if (
                event.source !== frame.current?.contentWindow ||
                event.origin !== 'null' ||
                event.data?.type !== 'poseidon:ready' ||
                event.data.version !== 1 ||
                channel
            )
                return;
            channel = new MessageChannel();
            channel.port1.onmessage = (message) => {
                if (
                    message.data?.version !== 1 ||
                    message.data.sessionId !== 'preview' ||
                    message.data.releaseId !== artifactId
                )
                    return;
                if (message.data?.type === 'ready')
                    channel?.port1.postMessage({
                        type: 'props',
                        version: 1,
                        sessionId: 'preview',
                        releaseId: artifactId,
                        props,
                    });
                if (message.data?.type === 'event')
                    channel?.port1.postMessage({
                        type: 'result',
                        version: 1,
                        sessionId: 'preview',
                        releaseId: artifactId,
                        requestId: message.data.requestId,
                        error: 'Preview has no live data or mutations; publish to run this app.',
                    });
            };
            frame.current?.contentWindow?.postMessage(
                { type: 'poseidon:init', version: 1, sessionId: 'preview', releaseId: artifactId },
                '*',
                [channel.port2],
            );
        };
        window.addEventListener('message', receive);
        return () => {
            window.removeEventListener('message', receive);
            channel?.port1.close();
        };
    }, [artifactId, props]);
    return (
        <div
            className="preview"
            role="dialog"
            aria-label="Draft preview"
            aria-modal="true"
            onKeyDown={(event) => {
                if (event.key === 'Escape') onClose();
            }}
        >
            <header>
                <span>Draft preview · no live data or mutations</span>
                <button autoFocus onClick={onClose}>
                    Close preview
                </button>
            </header>
            <iframe
                ref={frame}
                title="Draft preview"
                src={
                    (import.meta.env.VITE_RENDERER_ORIGIN ?? 'http://renderer.localhost:3001') +
                    '/artifacts/' +
                    artifactId
                }
                sandbox="allow-scripts allow-forms"
                referrerPolicy="no-referrer"
            />
        </div>
    );
}
