import { Preview } from './preview';
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './shell.css';

interface Session {
    id: string;
    releaseId: string;
    rendererUrl: string;
    basePath: string;
    props: Record<string, unknown>;
}
async function api(path: string, body?: unknown): Promise<unknown> {
    const response = await fetch(`/api/ui/${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const result: unknown = await response.json();
    if (
        !response.ok &&
        result &&
        typeof result === 'object' &&
        'error' in result &&
        result.error &&
        typeof result.error === 'object' &&
        'message' in result.error
    )
        throw Object.assign(new Error(String(result.error.message)), result.error);
    if (!response.ok)
        throw new Error(
            typeof result === 'object' && result && 'message' in result
                ? String(result.message)
                : 'Request failed.',
        );
    return result;
}
function Shell() {
    const [session, setSession] = useState<Session>();
    const [error, setError] = useState('');
    const [preview, setPreview] = useState<{
        artifactId: string;
        props: Record<string, unknown>;
    }>();
    const frame = useRef<HTMLIFrameElement>(null);
    useEffect(() => {
        void api(`resolve?path=${encodeURIComponent(location.pathname)}`)
            .then((result) => setSession(result as Session))
            .catch((reason) => setError(String(reason)));
    }, []);
    useEffect(() => {
        if (!session) return;
        let channel: MessageChannel | undefined;
        let disposed = false;
        let navigationSequence = 0;
        const route = () =>
            channel?.port1.postMessage({
                type: 'props',
                version: 1,
                sessionId: session.id,
                releaseId: session.releaseId,
                props: {
                    ...session.props,
                    route:
                        location.pathname.slice(
                            session.basePath === '/' ? 0 : session.basePath.length,
                        ) || '/',
                },
            });
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
            channel.port1.onmessage = async (message) => {
                if (
                    message.data?.version !== 1 ||
                    message.data.sessionId !== session.id ||
                    message.data.releaseId !== session.releaseId
                )
                    return;
                if (message.data?.type === 'ready') {
                    route();
                    return;
                }
                if (message.data?.type !== 'event' || typeof message.data.name !== 'string') return;
                const navigation = message.data.name === 'navigate' ? ++navigationSequence : 0;
                try {
                    const result = await api('event', {
                        sessionId: session.id,
                        releaseId: session.releaseId,
                        name: message.data.name,
                        payload: message.data.payload,
                    });
                    if (disposed) return;
                    if (
                        message.data.name === 'preview' &&
                        result &&
                        typeof result === 'object' &&
                        'artifactId' in result &&
                        typeof result.artifactId === 'string'
                    )
                        setPreview({
                            artifactId: result.artifactId,
                            props:
                                'props' in result ? (result.props as Record<string, unknown>) : {},
                        });
                    if (
                        result &&
                        typeof result === 'object' &&
                        'navigate' in result &&
                        typeof result.navigate === 'string' &&
                        navigation === navigationSequence
                    ) {
                        if (location.pathname !== result.navigate) {
                            history.pushState(null, '', result.navigate);
                        }
                    }
                    channel?.port1.postMessage({
                        type: 'result',
                        version: 1,
                        sessionId: session.id,
                        releaseId: session.releaseId,
                        requestId: message.data.requestId,
                        result,
                    });
                } catch (reason) {
                    if (!disposed)
                        channel?.port1.postMessage({
                            type: 'result',
                            version: 1,
                            sessionId: session.id,
                            releaseId: session.releaseId,
                            requestId: message.data.requestId,
                            error:
                                reason instanceof Error
                                    ? {
                                          message: reason.message,
                                          ...('problems' in reason
                                              ? { problems: reason.problems }
                                              : {}),
                                      }
                                    : { message: 'Request failed.' },
                        });
                }
            };
            frame.current?.contentWindow?.postMessage(
                {
                    type: 'poseidon:init',
                    version: 1,
                    sessionId: session.id,
                    releaseId: session.releaseId,
                },
                '*',
                [channel.port2],
            );
        };
        window.addEventListener('message', receive);
        window.addEventListener('popstate', route);
        return () => {
            disposed = true;
            channel?.port1.close();
            window.removeEventListener('message', receive);
            window.removeEventListener('popstate', route);
        };
    }, [session]);
    if (error)
        return (
            <main role="alert">
                <h1>Poseidon couldn’t start</h1>
                <p>{error}</p>
                <button onClick={() => location.reload()}>Try again</button>
            </main>
        );
    if (!session) return <main role="status">Loading Poseidon…</main>;
    return (
        <>
            {preview && (
                <Preview
                    artifactId={preview.artifactId}
                    props={preview.props}
                    onClose={() => setPreview(undefined)}
                />
            )}
            <iframe
                style={{ display: preview ? 'none' : 'block' }}
                ref={frame}
                src={session.rendererUrl}
                title="Poseidon Portal"
                onLoad={() =>
                    frame.current?.contentWindow?.postMessage({ type: 'poseidon:hello' }, '*')
                }
                sandbox="allow-scripts allow-forms"
                referrerPolicy="no-referrer"
            />
        </>
    );
}
createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Shell />
    </React.StrictMode>,
);
