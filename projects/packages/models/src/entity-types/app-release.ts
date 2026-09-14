import type { App } from './app';
import type { Entity } from '../entity';
import type { Theme } from './theme';
import type { UIComponent } from './ui-component';

export interface ReleaseSnapshot {
    app: App;
    components: UIComponent[];
    themes: Theme[];
}

export interface AppReleaseData extends Record<string, unknown> {
    appId: string;
    snapshot: ReleaseSnapshot;
    artifactId: string;
    diagnostics: string[];
}

export type AppRelease = Entity<AppReleaseData>;
