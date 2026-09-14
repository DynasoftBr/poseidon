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
                if (!draft.data.publishedReleaseId) return undefined;
                const release = (await this.entities.get(
                    'app-release',
                    draft.data.publishedReleaseId,
                )) as AppRelease;
                return {
                    ...release.data.snapshot.app,
                    data: {
                        ...release.data.snapshot.app.data,
                        publishedReleaseId: draft.data.publishedReleaseId,
                    },
                };
            }),
        );
        const matches = published
            .filter((app) => app !== undefined)
            .filter(
                (app) =>
                    app.data.domain === domain &&
                    (path === app.data.basePath ||
                        path.startsWith(app.data.basePath === '/' ? '/' : `${app.data.basePath}/`)),
            );
        matches.sort((a, b) => b.data.basePath.length - a.data.basePath.length);
        if (!matches[0]) throw new Error('No app matches this URL.');
        return matches[0];
    }
    public async snapshot(appId: string, options: PreviewOptions = {}): Promise<ReleaseSnapshot> {
        const app = structuredClone(asApp(await this.entities.get('app', appId)));
        const inheritedTheme = options.componentId
            ? ((await this.entities.get('ui-component', app.data.entryComponentId)) as UIComponent)
                  .data.themeId
            : undefined;
        app.data.entryComponentId = options.componentId ?? app.data.entryComponentId;
        const components = new Map(
            (await this.entities.query({ entityTypeId: 'ui-component' })).map((component) => [
                component.id,
                structuredClone(component) as UIComponent,
            ]),
        );
        const entry = components.get(app.data.entryComponentId);
        if (!entry) throw new Error(`Missing component: ${app.data.entryComponentId}`);
        const themeId = options.themeId ?? entry.data.themeId ?? inheritedTheme;
        if (themeId) entry.data.themeId = themeId;
        const themes = (await this.entities.query({ entityTypeId: 'theme' })).map(
            (theme) => structuredClone(theme) as Theme,
        );
        for (const record of [...components.values(), ...themes]) {
            if ('fileId' in record.data.source) {
                record.data.source = { code: await this.artifacts.read(record.data.source.fileId) };
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
            result.componentIds.includes(component.id),
        );
        const themeIds = new Set(
            snapshot.components.flatMap((component) =>
                component.data.themeId ? [component.data.themeId] : [],
            ),
        );
        snapshot.themes = snapshot.themes.filter((theme) => themeIds.has(theme.id));
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
                expectedVersion: snapshot.app.version,
                data: { publishedReleaseId: release.id },
            },
            actorId,
        );
        return release;
    }
    public async restore(appId: string, releaseId: string, actorId: string): Promise<void> {
        const release = (await this.entities.get('app-release', releaseId)) as AppRelease;
        if (release.data.appId !== appId) throw new Error('Release belongs to another app.');
        const app = await this.entities.get('app', appId);
        await this.entities.update(
            {
                entityTypeId: 'app',
                id: appId,
                expectedVersion: app.version,
                data: { publishedReleaseId: releaseId },
            },
            actorId,
        );
    }
}
function asApp(entity: Entity): App {
    const data = entity.data;
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
