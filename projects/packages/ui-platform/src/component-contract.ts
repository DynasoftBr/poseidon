import ts from 'typescript';
import type { ValueSchema } from '@poseidon/models';

export interface ComponentContract {
    props: Record<string, ValueSchema>;
    events: Record<string, ValueSchema>;
}

export function deriveComponentContract(code: string): ComponentContract {
    const source = ts.createSourceFile(
        'component.tsx',
        code,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
    );
    const declarations = new Map<string, ts.TypeNode>();
    for (const statement of source.statements) rememberDeclaration(statement, declarations);
    const parameter = defaultComponentParameter(source);
    const members = parameter?.type ? typeMembers(parameter.type, declarations) : [];
    const props: Record<string, ValueSchema> = {};
    const events: Record<string, ValueSchema> = {};
    for (const member of members) addMember(member, declarations, props, events);
    return { props, events };
}

function rememberDeclaration(
    statement: ts.Statement,
    declarations: Map<string, ts.TypeNode>,
): void {
    if (ts.isInterfaceDeclaration(statement)) {
        declarations.set(statement.name.text, ts.factory.createTypeLiteralNode(statement.members));
    } else if (ts.isTypeAliasDeclaration(statement)) {
        declarations.set(statement.name.text, statement.type);
    }
}

function addMember(
    member: ts.TypeElement,
    declarations: Map<string, ts.TypeNode>,
    props: Record<string, ValueSchema>,
    events: Record<string, ValueSchema>,
): void {
    if (ts.isMethodSignature(member)) {
        const name = propertyName(member.name);
        if (name) events[name] = parameterPayload(member.parameters[0], declarations);
        return;
    }
    if (!ts.isPropertySignature(member) || !member.type) return;
    const name = propertyName(member.name);
    if (!name) return;
    if (ts.isFunctionTypeNode(member.type)) {
        events[name] = eventPayload(member.type, declarations);
        return;
    }
    props[name] = { ...schemaFor(member.type, declarations), required: !member.questionToken };
}

export function prepareComponentData(
    current: Record<string, unknown>,
    supplied: Record<string, unknown>,
): Record<string, unknown> {
    const { props: _props, events: _events, dependencies: _dependencies, ...editable } = supplied;
    const source = editable.source ?? current.source;
    if (!source || typeof source !== 'object' || !('code' in source)) {
        throw new Error('A component requires TypeScript source.');
    }
    return { ...editable, ...deriveComponentContract(String(source.code)) };
}

function defaultComponentParameter(source: ts.SourceFile): ts.ParameterDeclaration | undefined {
    const declaration = source.statements.find(
        (statement): statement is ts.FunctionDeclaration =>
            ts.isFunctionDeclaration(statement) &&
            statement.modifiers?.some(
                (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword,
            ) === true,
    );
    if (declaration) return declaration.parameters[0];
    const exportAssignment = source.statements.find(ts.isExportAssignment);
    if (!exportAssignment) return undefined;
    const expression = exportAssignment.expression;
    if (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression)) {
        return expression.parameters[0];
    }
    return ts.isIdentifier(expression)
        ? namedComponentParameter(source, expression.text)
        : undefined;
}

function namedComponentParameter(
    source: ts.SourceFile,
    name: string,
): ts.ParameterDeclaration | undefined {
    for (const statement of source.statements) {
        if (ts.isFunctionDeclaration(statement) && statement.name?.text === name) {
            return statement.parameters[0];
        }
        const parameter = variableComponentParameter(statement, name);
        if (parameter) return parameter;
    }
    return undefined;
}

function variableComponentParameter(
    statement: ts.Statement,
    name: string,
): ts.ParameterDeclaration | undefined {
    if (!ts.isVariableStatement(statement)) return undefined;
    const declaration = statement.declarationList.declarations.find(
        (candidate) => ts.isIdentifier(candidate.name) && candidate.name.text === name,
    );
    const initializer = declaration?.initializer;
    return initializer && (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))
        ? initializer.parameters[0]
        : undefined;
}

function typeMembers(
    type: ts.TypeNode,
    declarations: Map<string, ts.TypeNode>,
): readonly ts.TypeElement[] {
    const resolved = resolveType(type, declarations);
    if (ts.isTypeLiteralNode(resolved)) return resolved.members;
    if (ts.isIntersectionTypeNode(resolved)) {
        return resolved.types.flatMap((part) => [...typeMembers(part, declarations)]);
    }
    return [];
}

function resolveType(type: ts.TypeNode, declarations: Map<string, ts.TypeNode>): ts.TypeNode {
    return ts.isTypeReferenceNode(type) && ts.isIdentifier(type.typeName)
        ? (declarations.get(type.typeName.text) ?? type)
        : type;
}

function propertyName(name: ts.PropertyName): string | undefined {
    return ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : undefined;
}

function eventPayload(
    callback: ts.FunctionTypeNode,
    declarations: Map<string, ts.TypeNode>,
): ValueSchema {
    return parameterPayload(callback.parameters[0], declarations);
}

function parameterPayload(
    parameter: ts.ParameterDeclaration | undefined,
    declarations: Map<string, ts.TypeNode>,
): ValueSchema {
    return parameter?.type ? schemaFor(parameter.type, declarations) : { type: 'object' };
}

function schemaFor(type: ts.TypeNode, declarations: Map<string, ts.TypeNode>): ValueSchema {
    const resolved = resolveType(type, declarations);
    if (ts.isLiteralTypeNode(resolved) && resolved.literal.kind === ts.SyntaxKind.NullKeyword) {
        return { type: 'null' };
    }
    const primitive = primitiveSchema(resolved.kind);
    if (primitive) return primitive;
    if (ts.isArrayTypeNode(resolved)) {
        return { type: 'array', items: schemaFor(resolved.elementType, declarations) };
    }
    if (ts.isTypeLiteralNode(resolved)) {
        const properties: Record<string, ValueSchema> = {};
        for (const member of resolved.members) {
            if (!ts.isPropertySignature(member) || !member.type) continue;
            const name = propertyName(member.name);
            if (name) {
                properties[name] = {
                    ...schemaFor(member.type, declarations),
                    required: !member.questionToken,
                };
            }
        }
        return { type: 'object', properties };
    }
    return { type: 'object' };
}

function primitiveSchema(kind: ts.SyntaxKind): ValueSchema | undefined {
    if (kind === ts.SyntaxKind.StringKeyword) return { type: 'string' };
    if (kind === ts.SyntaxKind.NumberKeyword) return { type: 'number' };
    if (kind === ts.SyntaxKind.BooleanKeyword) return { type: 'boolean' };
    if (kind === ts.SyntaxKind.NullKeyword) return { type: 'null' };
    return undefined;
}
