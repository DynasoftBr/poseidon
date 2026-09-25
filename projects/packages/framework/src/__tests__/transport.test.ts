import { BrowserContextStore } from '../browser/context-store';
import { NodeContextStore } from '../node/context-store';
import { createPoseidon } from '../poseidon';
import { PoseidonContext } from '../context/poseidon-context';
import { HttpPoseidonTransport } from '../transport/http-poseidon-transport';
import type { PoseidonTransport } from '../transport/poseidon-transport';

class Transport implements PoseidonTransport {
    send<TResult>(): Promise<TResult> {
        return Promise.resolve(undefined as TResult);
    }
}

function context(): PoseidonContext {
    return new PoseidonContext(new Transport(), () => 'token');
}

describe('transports and context stores', () => {
    it('should send HTTP requests with optional authorization', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ ok: true }) });
        vi.stubGlobal('fetch', fetchMock);
        const transport = new HttpPoseidonTransport('https://poseidon.test');
        await transport.send({ entityType: 'customer', action: 'get', payload: {} }, undefined);
        await transport.send({ entityType: 'customer', action: 'get', payload: {} }, 'abc');
        expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('authorization');
        expect(fetchMock.mock.calls[1][1].headers).toMatchObject({ authorization: 'Bearer abc' });
        vi.unstubAllGlobals();
    });

    it('should store one browser context', async () => {
        const store = new BrowserContextStore();
        const first = context();
        expect(() => store.context()).toThrow('Initialize Poseidon');
        store.initialize(first);
        expect(store.context()).toBe(first);
        await expect(store.run(first, () => Promise.resolve('ok'))).resolves.toBe('ok');
        expect(() => store.initialize(context())).toThrow('already initialized');
        expect(() => store.run(context(), () => Promise.resolve('no'))).toThrow(
            'only its initialized context',
        );
    });

    it('should isolate node contexts and create Poseidon facades', async () => {
        const store = new NodeContextStore();
        const first = context();
        const second = context();
        expect(() => store.context()).toThrow('Initialize Poseidon');
        store.initialize(first);
        expect(store.context()).toBe(first);
        await store.run(second, () => Promise.resolve(expect(store.context()).toBe(second)));
        expect(store.context()).toBe(first);
        const poseidon = createPoseidon(store);
        poseidon.initialize({ context: first });
        expect(poseidon.context()).toBe(first);
        await poseidon.run(second, () => Promise.resolve(expect(poseidon.context()).toBe(second)));
    });
});

it('should expose browser and node entry points', async () => {
    const browser = await import('../browser/index');
    const node = await import('../node/index');
    expect(browser.poseidon).toBeDefined();
    expect(node.poseidon).toBeDefined();
});

it('should require Poseidon initialization before resolving an operation context', async () => {
    vi.resetModules();
    const { currentContext } = await import('../poseidon');

    expect(() => currentContext()).toThrow('Initialize Poseidon before invoking an operation.');
});
