import type { Entity } from '../entity';
import type { FormDefinition } from '../form-definition';
import type { Source } from '../source';
import type { UIBinding } from '../ui-binding';
import type { ValueSchema } from '../value-schema';

export interface UIComponentData extends Record<string, unknown> {
    name: string;
    source: Source;
    props: Record<string, ValueSchema>;
    events: Record<string, ValueSchema>;
    themeId?: string;
    bindings?: Record<string, UIBinding>;
    form?: FormDefinition;
}

export interface UIComponent extends Entity, UIComponentData {}
