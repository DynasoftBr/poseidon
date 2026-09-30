import type { Rule } from 'eslint';
import ts from 'typescript';

const printer = ts.createPrinter({ removeComments: true });

type TypedTag = ts.JSDocParameterTag | ts.JSDocReturnTag;
type Documentation = { source: ts.SourceFile; offset: number; tags: readonly ts.JSDocTag[] };
type DocumentedType = { tag: TypedTag; type: ts.TypeNode; documentation: Documentation };

function documentationOwner(node: ts.SignatureDeclaration): ts.Node {
    let owner: ts.Node = node;
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
        while (
            ts.isVariableDeclaration(owner.parent) ||
            ts.isVariableDeclarationList(owner.parent) ||
            ts.isVariableStatement(owner.parent) ||
            ts.isPropertyDeclaration(owner.parent) ||
            ts.isPropertyAssignment(owner.parent) ||
            ts.isParenthesizedExpression(owner.parent)
        ) {
            owner = owner.parent;
        }
    }
    return owner;
}

function documentationOf(
    node: ts.SignatureDeclaration,
    source: ts.SourceFile,
): Documentation | undefined {
    const owner = documentationOwner(node);
    const ranges = [
        ...(ts.getTrailingCommentRanges(source.text, owner.pos) ?? []),
        ...(ts.getLeadingCommentRanges(source.text, owner.pos) ?? []),
    ];
    const range = ranges.sort((left, right) => left.pos - right.pos).at(-1);
    if (!range || !source.text.startsWith('/**', range.pos)) return undefined;
    const comment = source.text.slice(range.pos, range.end);
    const parsed = ts.createSourceFile(
        'documentation.ts',
        `${comment}\nfunction documented() {}`,
        ts.ScriptTarget.Latest,
        true,
    );
    return { source: parsed, offset: range.pos, tags: ts.getJSDocTags(parsed.statements[0]) };
}

function typeText(type: ts.TypeNode, source: ts.SourceFile): string {
    const result = ts.transform(type, [
        (context) => {
            const visit: ts.Visitor = (node) => {
                if (ts.isParenthesizedTypeNode(node)) return ts.visitNode(node.type, visit);
                const visited = ts.visitEachChild(node, visit, context);
                if (ts.isConditionalTypeNode(visited) && ts.isUnionTypeNode(visited.extendsType)) {
                    // The JSDoc parser requires parentheses around a conditional's union constraint.
                    return ts.factory.updateConditionalTypeNode(
                        visited,
                        visited.checkType,
                        ts.factory.createParenthesizedType(visited.extendsType),
                        visited.trueType,
                        visited.falseType,
                    );
                }
                return visited;
            };
            return (node) => ts.visitNode(node, visit, ts.isTypeNode)!;
        },
    ]);
    const text = printer.printNode(ts.EmitHint.Unspecified, result.transformed[0], source);
    result.dispose();
    return text;
}

function normalizedType(text: string): string {
    const source = ts.createSourceFile(
        'type.ts',
        `type Documented = ${text};`,
        ts.ScriptTarget.Latest,
        true,
    );
    const declaration = source.statements[0] as ts.TypeAliasDeclaration;
    const printed = typeText(declaration.type, source);
    const scanner = ts.createScanner(
        ts.ScriptTarget.Latest,
        true,
        ts.LanguageVariant.Standard,
        printed,
    );
    const tokens: string[] = [];
    while (scanner.scan() !== ts.SyntaxKind.EndOfFileToken) tokens.push(scanner.getTokenText());
    return JSON.stringify(tokens);
}

function documentedType(tag: TypedTag, source: ts.SourceFile): string | undefined {
    const type = tag.typeExpression?.type;
    if (!type || source.text.startsWith('{@', tag.typeExpression!.getStart(source))) {
        return undefined;
    }
    if (ts.isJSDocOptionalType(type)) return typeText(type.type, source);
    if (ts.isJSDocVariadicType(type)) {
        return typeText(ts.factory.createArrayTypeNode(type.type), source);
    }
    return typeText(type, source);
}

function parameterTypes(
    node: ts.SignatureDeclaration,
    documentation: Documentation,
): DocumentedType[] {
    const tags = documentation.tags.filter(ts.isJSDocParameterTag);
    const roots = tags.filter((tag) => ts.isIdentifier(tag.name));
    return node.parameters.flatMap((parameter, index) => {
        if (!parameter.type) return [];
        const name = parameter.name;
        const tag = ts.isIdentifier(name)
            ? roots.find((candidate) => candidate.name.getText(documentation.source) === name.text)
            : roots[index];
        return tag ? [{ tag, type: parameter.type, documentation }] : [];
    });
}

function declarationTypes(node: ts.Node, source: ts.SourceFile): DocumentedType[] {
    if (!ts.isFunctionLike(node)) return [];
    const documentation = documentationOf(node, source);
    if (!documentation) return [];
    const parameters = parameterTypes(node, documentation);
    const returns = documentation.tags.find(ts.isJSDocReturnTag);
    if (returns && node.type) parameters.push({ tag: returns, type: node.type, documentation });
    return parameters;
}

function reportType(
    context: Rule.RuleContext,
    source: ts.SourceFile,
    documented: DocumentedType,
): void {
    const { tag, type, documentation } = documented;
    const expected = typeText(type, source);
    const actual = documentedType(tag, documentation.source);
    if (actual !== undefined && normalizedType(actual) === normalizedType(expected)) return;

    const start = documentation.offset + tag.getStart(documentation.source);
    const { line, character } = source.getLineAndCharacterOfPosition(start);
    context.report({
        loc: { line: line + 1, column: character },
        messageId: actual === undefined ? 'missingType' : 'mismatchedType',
        data: { tag: tag.tagName.text, expected, actual: actual ?? '' },
    });
}

export const jsdocTypes: Rule.RuleModule = {
    meta: {
        type: 'problem',
        schema: [],
        messages: {
            missingType: 'JSDoc @{{tag}} must include the TypeScript type { {{expected}} }.',
            mismatchedType:
                'JSDoc @{{tag}} type { {{actual}} } must match the TypeScript annotation { {{expected}} }.',
        },
    },
    create(context) {
        return {
            Program() {
                const source = ts.createSourceFile(
                    context.filename,
                    context.sourceCode.text,
                    ts.ScriptTarget.Latest,
                    true,
                );
                function visit(node: ts.Node): void {
                    for (const documented of declarationTypes(node, source)) {
                        reportType(context, source, documented);
                    }
                    ts.forEachChild(node, visit);
                }
                visit(source);
            },
        };
    },
};
