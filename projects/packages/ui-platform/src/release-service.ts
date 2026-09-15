import { randomUUID } from 'node:crypto';
import type {
    App,
    AppRelease,
    Entity,
    ReleaseSnapshot,
    Theme,
    UIComponent,
} from '@poseidon/models';
import type { EntityService } from '@poseidon/runtime';
import type { ArtifactStore } from './artifact-store';

export interface PreviewOptions {
    componentId?: string;
    themeId?: string;
    props?: Record<string, unknown>;
}

export interface UICompiler {
    compile(snapshot: ReleaseSnapshot): Promise<{ html: string; componentIds: string[] }>;
}
export class ReleaseService {
    public constructor(
        private readonly entities: EntityService,
        private readonly artifacts: ArtifactStore,
        private readonly compiler: UICompiler,
    ) {}
    public async resolve(domain: string, path: string): Promise<App> {
        const apps = await this.entities.query({ entityTypeId: 'app' });
        const published = await Promise.all(
            apps.map(async (record) => {
                const draft = record as App;
                if (!draft.publishedReleaseId) return undefined;
                const release = (await this.entities.get(
                    'app-release',
                    draft.publishedReleaseId,
                )) as AppRelease;
                return {
                    ...release.snapshot.app,
                    publishedReleaseId: draft.publishedReleaseId,
                };
            }),
        );
        const matches = published
            .filter((app) => app !== undefined)
            .filter(
                (app) =>
                    app.domain === domain &&
                    (path === app.basePath ||
                        path.startsWith(app.basePath === '/' ? '/' : `${app.basePath}/`)),
            );
        matches.sort((a, b) => b.basePath.length - a.basePath.length);
        if (!matches[0]) throw new Error('No app matches this URL.');
        return matches[0];
    }
    public async snapshot(appId: string, options: PreviewOptions = {}): Promise<ReleaseSnapshot> {
        const app = structuredClone(asApp(await this.entities.get('app', appId)));
        const inheritedTheme = options.componentId
            ? ((await this.entities.get('ui-component', app.entryComponentId)) as UIComponent)
                  .themeId
            : undefined;
        app.entryComponentId = options.componentId ?? app.entryComponentId;
        const components = new Map(
            (await this.entities.query({ entityTypeId: 'ui-component' })).map((component) => [
                component._id,
                structuredClone(component) as UIComponent,
            ]),
        );
        const entry = components.get(app.entryComponentId);
        if (!entry) throw new Error(`Missing component: ${app.entryComponentId}`);
        const themeId = options.themeId ?? entry.themeId ?? inheritedTheme;
        if (themeId) entry.themeId = themeId;
        const themes = (await this.entities.query({ entityTypeId: 'theme' })).map(
            (theme) => structuredClone(theme) as Theme,
        );
        for (const record of [...components.values(), ...themes]) {
            if ('fileId' in record.source) {
                record.source = { code: await this.artifacts.read(record.source.fileId) };
            }
        }
        return { app, components: [...components.values()], themes };
    }
    public async preview(appId: string, options: PreviewOptions = {}): Promise<string> {
        const snapshot = await this.snapshot(appId, options);
        const result = await this.compiler.compile(snapshot);
        return this.artifacts.put(result.html);
    }
    public async publish(appId: string, actorId: string): Promise<AppRelease> {
        const snapshot = await this.snapshot(appId);
        const result = await this.compiler.compile(snapshot);
        snapshot.components = snapshot.components.filter((component) =>
            result.componentIds.includes(component._id),
        );
        const themeIds = new Set(
            snapshot.components.flatMap((component) =>
                component.themeId ? [component.themeId] : [],
            ),
        );
        snapshot.themes = snapshot.themes.filter((theme) => themeIds.has(theme._id));
        const artifactId = await this.artifacts.put(result.html);
        const release = (await this.entities.create(
            {
                entityTypeId: 'app-release',
                id: randomUUID(),
                data: { appId, snapshot, artifactId, diagnostics: [] },
            },
            actorId,
        )) as AppRelease;
        await this.entities.update(
            {
                entityTypeId: 'app',
                id: appId,
                expectedVersion: snapshot.app._version,
                data: { publishedReleaseId: release._id },
            },
            actorId,
        );
        return release;
    }
    public async restore(appId: string, releaseId: string, actorId: string): Promise<void> {
        const release = (await this.entities.get('app-release', releaseId)) as AppRelease;
        if (release.appId !== appId) throw new Error('Release belongs to another app.');
        const app = await this.entities.get('app', appId);
        await this.entities.update(
            {
                entityTypeId: 'app',
                id: appId,
                expectedVersion: app._version,
                data: { publishedReleaseId: releaseId },
            },
            actorId,
        );
    }
}
function asApp(entity: Entity): App {
    const data = entity;
    if (
        typeof data.domain !== 'string' ||
        typeof data.basePath !== 'string' ||
        !/^\/(?:[^?#]*[^/])?$/.test(data.basePath) ||
        typeof data.entryComponentId !== 'string'
    ) {
        throw new Error('Invalid app URL definition.');
    }
    return entity as App;
}
