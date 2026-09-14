import React from 'react';
import { createRoot } from 'react-dom/client';
import Entry from '@poseidon/entry';

const root = createRoot(globalThis.document.getElementById('root'));
const pending = new Map();
let port;
let identity;
let sequence = 0;
function post(message) {
    port.postMessage({ ...message, ...identity, version: 1 });
}
function emit(name, payload) {
    return new Promise((resolve, reject) => {
        const requestId = String(++sequence);
        const timer = globalThis.setTimeout(() => {
            pending.delete(requestId);
            reject(new Error('Request timed out.'));
        }, 75_000);
        pending.set(requestId, { resolve, reject, timer });
        post({ type: 'event', name, payload, requestId });
    });
}
function receive(event) {
    const message = event.data;
    if (
        !message ||
        message.version !== 1 ||
        message.sessionId !== identity.sessionId ||
        message.releaseId !== identity.releaseId
    ) {
        return;
    }
    if (message.type === 'props') {
        root.render(React.createElement(Entry, { ...message.props, onEvent: emit }));
    }
    if (message.type === 'result') {
        const item = pending.get(message.requestId);
        if (!item) return;
        globalThis.clearTimeout(item.timer);
        pending.delete(message.requestId);
        if (message.error) {
            item.reject(
                typeof message.error === 'string'
                    ? new Error(message.error)
                    : Object.assign(new Error(message.error.message), {
                          problems: message.error.problems,
                      }),
            );
        } else item.resolve(message.result);
    }
}
function ready() {
    globalThis.parent.postMessage({ type: 'poseidon:ready', version: 1 }, '*');
}
globalThis.addEventListener('message', (event) => {
    if (event.source !== globalThis.parent || port) return;
    if (event.data?.type === 'poseidon:hello') {
        ready();
        return;
    }
    if (!validHandshake(event)) return;
    identity = { sessionId: event.data.sessionId, releaseId: event.data.releaseId };
    port = event.ports[0];
    port.onmessage = receive;
    port.start();
    post({ type: 'ready' });
});
ready();

function validHandshake(event) {
    return (
        event.data?.type === 'poseidon:init' &&
        event.data.version === 1 &&
        typeof event.data.sessionId === 'string' &&
        typeof event.data.releaseId === 'string' &&
        event.ports[0]
    );
}
