import { handleBinding, type BindingServices } from './ui-bindings';
import { randomUUID } from 'node:crypto';
import express, { type Express, type RequestHandler } from 'express';
import type { AppRelease, JsonValue } from '@poseidon/models';
import { type EntityService, type EntityStore, type EventPublisher } from '@poseidon/runtime';
import { UIBuildError, type ArtifactStore, type ReleaseService } from '@poseidon/ui-platform';

interface Session {
    release: AppRelease;
    expires: number;
}
export function configureUI(
    app: Express,
    dependencies: {
        entities: EntityService;
        releases: ReleaseService;
        artifacts: ArtifactStore;
        store: EntityStore;
        publisher: EventPublisher;
    },
    configuration: { rendererOrigin?: string; clientOrigin?: string } = {},
): Express {
    const { entities, releases, artifacts } = dependencies;
    const rendererOrigin = configuration.rendererOrigin ?? 'http://renderer.localhost:3001';
    const clientOrigin = configuration.clientOrigin ?? 'http://127.0.0.1:5173';
    const sessions = new Map<string, Session>();
    app.get('/api/ui/resolve', async (request, response, next) => {
        try {
            const selected = await releases.resolve(
                request.hostname === '127.0.0.1' ? 'localhost' : request.hostname,
                String(request.query.path ?? '/'),
            );
            if (!selected.publishedReleaseId) {
                throw new Error('This app has no published release.');
            }
            const release = (await entities.get(
                'app-release',
                selected.publishedReleaseId,
            )) as AppRelease;
            const id = randomUUID();
            expireSessions(sessions);
            sessions.set(id, { release, expires: Date.now() + 8 * 60 * 60 * 1000 });
            response.json({
                id,
                releaseId: release._id,
                basePath: selected.basePath,
                rendererUrl: `${rendererOrigin}/artifacts/${release.artifactId}`,
                props: { user: { name: 'Local user' }, localDevelopment: true },
            });
        } catch (error) {
            next(error);
        }
    });
    app.post('/api/ui/event', eventHandler(sessions, dependencies));
    return createRenderer(artifacts, clientOrigin);
}
function createRenderer(artifacts: ArtifactStore, clientOrigin: string): Express {
    const renderer = express();
    renderer.get('/artifacts/:id', async (request, response) => {
        try {
            response.set({
                'Content-Security-Policy': `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src data:; worker-src blob:; form-action 'none'; base-uri 'none'; frame-src 'none'; frame-ancestors ${clientOrigin}`,
                'Referrer-Policy': 'no-referrer',
                'X-Content-Type-Options': 'nosniff',
                'Cache-Control': 'public,max-age=31536000,immutable',
            });
            response.type('html').send(await artifacts.read(request.params.id));
        } catch {
            response.status(404).end();
        }
    });
    return renderer;
}

function expireSessions(sessions: Map<string, Session>): void {
    for (const [key, session] of sessions) {
        if (session.expires < Date.now()) sessions.delete(key);
    }
}

function eventHandler(
    sessions: Map<string, Session>,
    dependencies: BindingServices,
): RequestHandler {
    return async (request, response, next) => {
        try {
            const session = sessions.get(String(request.body.sessionId));
            if (
                !session ||
                session.expires < Date.now() ||
                session.release._id !== request.body.releaseId
            ) {
                throw new Error('Session expired. Reload the app.');
            }
            response.json(
                (await handleBinding(
                    dependencies,
                    session.release,
                    String(request.body.name),
                    request.body.payload as Record<string, JsonValue>,
                )) ?? null,
            );
        } catch (error) {
            if (error instanceof UIBuildError) {
                response.status(422).json({ message: error.message });
                return;
            }
            next(error);
        }
    };
}
