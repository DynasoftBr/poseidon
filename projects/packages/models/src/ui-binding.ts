export type UIBinding =
    | { kind: 'query'; entityTypeId: string }
    | { kind: 'create' | 'update' | 'delete'; entityTypeId: string }
    | { kind: 'navigate' }
    | { kind: 'publish' | 'preview' | 'restore'; appId: string }
    | { kind: 'submit-form'; componentId: string };
