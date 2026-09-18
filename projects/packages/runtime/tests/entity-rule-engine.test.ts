import type { APIAction, EntityProperty } from '@poseidon/models';
import { applyEntityRules } from '../src/entity-rule-engine';

describe('applyEntityRules', () => {
    const properties: EntityProperty[] = [
        property('order:total', 'total'),
        property('order:status', 'status'),
    ];

    it('should apply a declarative consequence when its specification matches', () => {
        const actions: APIAction[] = [
            {
                id: 'order:create',
                name: 'create',
                label: 'Create order',
                operation: 'create',
                enabled: true,
                before: [],
                after: [],
                rules: [
                    {
                        id: 'order:mark-review',
                        specification: {
                            kind: 'comparison',
                            propertyId: 'order:total',
                            operator: 'greater-than',
                            value: 1000,
                        },
                        consequence: {
                            kind: 'set-value',
                            propertyId: 'order:status',
                            value: 'review',
                        },
                    },
                ],
            },
        ];

        expect(applyEntityRules(actions, 'create', properties, { total: 1200 })).toEqual({
            total: 1200,
            status: 'review',
        });
    });

    it('should reject a mutation when a declarative rule requires it', () => {
        const actions: APIAction[] = [
            {
                id: 'order:create',
                name: 'create',
                label: 'Create order',
                operation: 'create',
                enabled: true,
                before: [],
                after: [],
                rules: [
                    {
                        id: 'order:reject-negative',
                        specification: {
                            kind: 'comparison',
                            propertyId: 'order:total',
                            operator: 'less-than',
                            value: 0,
                        },
                        consequence: { kind: 'reject', message: 'Total cannot be negative.' },
                    },
                ],
            },
        ];

        expect(() => applyEntityRules(actions, 'create', properties, { total: -1 })).toThrow(
            'The entity is invalid.',
        );
    });

    it('should evaluate compound specifications and supported comparisons', () => {
        const actions: APIAction[] = [
            {
                id: 'order:update',
                name: 'update',
                label: 'Update order',
                operation: 'update',
                enabled: true,
                before: [],
                after: [],
                rules: [
                    {
                        id: 'order:approved',
                        specification: {
                            kind: 'and',
                            conditions: [
                                {
                                    kind: 'comparison',
                                    propertyId: 'order:total',
                                    operator: 'greater-than',
                                    value: 10,
                                },
                                {
                                    kind: 'not',
                                    condition: {
                                        kind: 'comparison',
                                        propertyId: 'order:status',
                                        operator: 'equals',
                                        value: 'blocked',
                                    },
                                },
                            ],
                        },
                        consequence: {
                            kind: 'set-value',
                            propertyId: 'order:status',
                            value: 'approved',
                        },
                    },
                    {
                        id: 'order:tagged',
                        specification: {
                            kind: 'or',
                            conditions: [
                                {
                                    kind: 'comparison',
                                    propertyId: 'order:status',
                                    operator: 'contains',
                                    value: 'vip',
                                },
                                {
                                    kind: 'comparison',
                                    propertyId: 'order:total',
                                    operator: 'not-equals',
                                    value: 0,
                                },
                            ],
                        },
                        consequence: { kind: 'set-value', propertyId: 'order:total', value: 99 },
                    },
                ],
            },
        ];

        expect(
            applyEntityRules(actions, 'update', properties, { total: 11, status: 'vip' }),
        ).toEqual({
            total: 99,
            status: 'approved',
        });
        expect(applyEntityRules(actions, 'create', properties, { total: 11 })).toEqual({
            total: 11,
        });
    });

    it('should reject a rule that writes to an unknown property', () => {
        const actions: APIAction[] = [
            {
                id: 'order:create',
                name: 'create',
                label: 'Create',
                operation: 'create',
                enabled: true,
                before: [],
                after: [],
                rules: [
                    {
                        id: 'invalid',
                        specification: {
                            kind: 'comparison',
                            propertyId: 'order:total',
                            operator: 'equals',
                            value: 1,
                        },
                        consequence: { kind: 'set-value', propertyId: 'missing', value: true },
                    },
                ],
            },
        ];

        expect(() => applyEntityRules(actions, 'create', properties, { total: 1 })).toThrowError(
            expect.objectContaining({
                problems: [
                    {
                        property: 'actions',
                        message: "Rule references missing property 'missing'.",
                    },
                ],
            }),
        );
    });

    it('should distinguish absent properties from falsey values', () => {
        const actions: APIAction[] = [
            {
                id: 'order:create',
                name: 'create',
                label: 'Create',
                operation: 'create',
                enabled: true,
                before: [],
                after: [],
                rules: [
                    {
                        id: 'missing-status',
                        specification: {
                            kind: 'comparison',
                            propertyId: 'order:status',
                            operator: 'exists',
                            value: false,
                        },
                        consequence: {
                            kind: 'set-value',
                            propertyId: 'order:status',
                            value: false,
                        },
                    },
                ],
            },
        ];

        expect(applyEntityRules(actions, 'create', properties, { total: 1 })).toEqual({
            total: 1,
            status: false,
        });
        expect(
            applyEntityRules(actions, 'create', properties, { total: 1, status: false }),
        ).toEqual({ total: 1, status: false });
    });
});

function property(id: string, name: string): EntityProperty {
    return {
        _id: id,
        entityTypeId: 'order',
        name,
        type: 'string',
    };
}
