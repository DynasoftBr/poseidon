import ts from 'typescript';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ruleCompiler } from './rule-schema.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const configFile = ts.readConfigFile(join(root, 'tsconfig.json'), ts.sys.readFile);
if (configFile.error) throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'));
const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
const program = ts.createProgram(config.fileNames, config.options);
const checker = program.getTypeChecker();
const referenceDeclaration = program.getSourceFile(join(root, 'src/sdk/entity-reference.ts'))
    .statements.find(node => ts.isInterfaceDeclaration(node) && node.name.text === 'EntityReference');
const referenceSymbol = checker.getSymbolAtLocation(referenceDeclaration.name);
const pageDeclaration = program.getSourceFile(join(root, 'src/sdk/paginated-result.ts'))
    .statements.find(node => ts.isInterfaceDeclaration(node) && node.name.text === 'PaginatedResult');
const pageSymbol = checker.getSymbolAtLocation(pageDeclaration.name);
const diagnostics = [...config.errors, ...ts.getPreEmitDiagnostics(program)];
if (diagnostics.length) {
    throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: name => name,
        getCurrentDirectory: () => root,
        getNewLine: () => '\n',
    }));
}

function annotations(node) {
    return (ts.canHaveDecorators(node) ? ts.getDecorators(node) ?? [] : []).map(decorator => {
        const call = decorator.expression;
        if (!ts.isCallExpression(call) || !ts.isIdentifier(call.expression)) {
            throw new Error('Prototype requires directly named decorator calls.');
        }
        return { name: call.expression.text, arguments: call.arguments };
    });
}

function numericBounds(annotation) {
    const options = annotation.arguments[0];
    if (!options) return {};
    if (!ts.isObjectLiteralExpression(options)) throw new Error(`${annotation.name} requires literal options.`);
    const bounds = {};
    for (const option of options.properties) {
        if (!ts.isPropertyAssignment(option) || !['min', 'max'].includes(option.name.getText())) {
            throw new Error(`${annotation.name} supports only min and max.`);
        }
        const value = option.initializer;
        if (annotation.name === 'Decimal') {
            if (!ts.isStringLiteral(value) || !/^-?[0-9]+(\.[0-9]+)?$/.test(value.text)) {
                throw new Error('Decimal bounds must be decimal string literals.');
            }
            bounds[option.name.getText()] = value.text;
        } else {
            const negative = ts.isPrefixUnaryExpression(value) && value.operator === ts.SyntaxKind.MinusToken;
            const literal = negative ? value.operand : value;
            const number = ts.isNumericLiteral(literal) ? Number(literal.text) * (negative ? -1 : 1) : NaN;
            if (!Number.isSafeInteger(number)) throw new Error(`${annotation.name} bounds must be safe integer literals.`);
            if (annotation.name === 'Length' && number < 0) throw new Error('Length bounds must be nonnegative.');
            bounds[option.name.getText()] = number;
        }
    }
    if (bounds.min !== undefined && bounds.max !== undefined) {
        const scale = Math.max(...[bounds.min, bounds.max].map(value => String(value).split('.')[1]?.length ?? 0));
        const scaled = value => {
            const [whole, fraction = ''] = String(value).split('.');
            return BigInt(whole + fraction.padEnd(scale, '0'));
        };
        if (scaled(bounds.min) > scaled(bounds.max)) throw new Error(`${annotation.name} min must not exceed max.`);
    }
    return bounds;
}

function schemaFor(type) {
    if (checker.isArrayType(type)) {
        return { type: 'array', items: schemaFor(checker.getTypeArguments(type)[0]) };
    }
    if (type.symbol === referenceSymbol) return { $ref: '#/$defs/EntityReference' };
    if (type.aliasSymbol?.name === 'EntityId') return { type: 'string' };
    if (type.symbol?.declarations?.some(item => ts.isClassDeclaration(item)
        && annotations(item).some(item => item.name === 'EntityType'))) {
        return { $ref: `#/$defs/${type.symbol.name}` };
    }
    if (type.symbol?.name === 'Decimal') return { type: 'string', pattern: '^-?[0-9]+(\\.[0-9]+)?$' };
    if (type.isStringLiteral()) return { type: 'string', const: type.value };
    if (type.isUnion()) {
        const members = type.types;
        if (members.every(member => member.isStringLiteral())) {
            return { type: 'string', enum: members.map(member => member.value) };
        }
        if (members.some(member => member.flags & ts.TypeFlags.Null)) {
            const remaining = members.filter(member => !(member.flags & ts.TypeFlags.Null));
            if (remaining.length === 1) {
                return { anyOf: [schemaFor(remaining[0]), { type: 'null' }] };
            }
        }
        throw new Error(`Unsupported prototype union: ${checker.typeToString(type)}`);
    }
    if (type.flags & ts.TypeFlags.String) return { type: 'string' };
    if (type.flags & ts.TypeFlags.Number) return { type: 'number' };
    if (type.symbol?.name === 'Date') return { type: 'string', format: 'date-time' };
    if (type.symbol?.name === '__type') {
        const members = checker.getPropertiesOfType(type);
        return { type: 'object', additionalProperties: false,
            required: members.filter(member => !(member.flags & ts.SymbolFlags.Optional)).map(member => member.name),
            properties: Object.fromEntries(members.map(member => [member.name, propertySchema(member)])) };
    }
    throw new Error(`Unsupported prototype type: ${checker.typeToString(type)}`);
}

function propertySchema(property) {
    const declaration = property.valueDeclaration ?? property.declarations?.[0];
    if (!declaration || !(ts.isPropertyDeclaration(declaration) || ts.isPropertySignature(declaration))) {
        throw new Error(`Unsupported member: ${property.name}`);
    }
    if (declaration.questionToken) throw new Error(`Use explicit null for ${property.name}.`);
    const schema = schemaFor(checker.getTypeOfSymbolAtLocation(property, declaration));
    for (const annotation of annotations(declaration)) {
        switch (annotation.name) {
            case 'Length': {
                const target = schema.anyOf?.find(item => item.type !== 'null') ?? schema;
                if (!['string', 'array'].includes(target.type)) throw new Error('Length requires string or array.');
                const bounds = numericBounds(annotation);
                const suffix = target.type === 'string' ? 'Length' : 'Items';
                if (bounds.min !== undefined) target[`min${suffix}`] = bounds.min;
                if (bounds.max !== undefined) target[`max${suffix}`] = bounds.max;
                break;
            }
            case 'Email':
                if (schema.type !== 'string') throw new Error('Email requires string.');
                schema.format = 'email';
                break;
            case 'Integer': {
                if (schema.type !== 'number') throw new Error('Integer requires number.');
                schema.type = 'integer';
                const bounds = numericBounds(annotation);
                if (bounds.min !== undefined) schema.minimum = bounds.min;
                if (bounds.max !== undefined) schema.maximum = bounds.max;
                break;
            }
            case 'Decimal': {
                if (checker.getTypeOfSymbolAtLocation(property, declaration).symbol?.name !== 'Decimal') {
                    throw new Error('Decimal requires the Decimal value type.');
                }
                const bounds = numericBounds(annotation);
                if (bounds.min !== undefined) schema.decimalMinimum = bounds.min;
                if (bounds.max !== undefined) schema.decimalMaximum = bounds.max;
                break;
            }
            case 'References':
                break;
            default:
                throw new Error(`Unsupported property decorator: ${annotation.name}`);
        }
    }
    if (declaration.parent.name?.text === 'Entity') schema.readOnly = true;
    return schema;
}

const classes = config.fileNames.flatMap(filename => {
    const source = program.getSourceFile(filename);
    return source.statements.filter(ts.isClassDeclaration);
});
const definitions = {};
const compileRules = ruleCompiler(checker, annotations);
function relationshipFor(property) {
    const annotation = annotations(property.valueDeclaration).find(item => item.name === 'References');
    if (!annotation) return undefined;
    const targetNode = annotation.arguments[0];
    if (!targetNode || !ts.isIdentifier(targetNode)) {
        throw new Error('References requires a direct entity class.');
    }
    const target = checker.getTypeAtLocation(targetNode).symbol;
    if (!target?.declarations?.some(item => ts.isClassDeclaration(item)
        && annotations(item).some(item => item.name === 'EntityType'))) {
        throw new Error('References target must be a registered entity.');
    }
    const options = annotation.arguments[1];
    const values = {};
    if (options) {
        if (!ts.isObjectLiteralExpression(options)) throw new Error('References requires literal options.');
        for (const option of options.properties) {
            if (!ts.isPropertyAssignment(option) || !ts.isStringLiteral(option.initializer)) {
                throw new Error('References options must be strings.');
            }
            values[option.name.getText()] = option.initializer.text;
        }
    }
    if (Object.keys(values).some(key => key !== 'through')) throw new Error('Only through is supported; relationship names come from properties.');
    const propertyType = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(property, property.valueDeclaration));
    const expectedSymbol = values.through ? pageSymbol : referenceSymbol;
    if (propertyType.symbol !== expectedSymbol || checker.getTypeArguments(propertyType)[0]?.symbol !== target) {
        throw new Error(`${property.name} must use ${values.through ? 'PaginatedResult' : 'EntityReference'}<${target.name}>.`);
    }
    return {
        name: property.name,
        definition: {
            target: { $ref: `#/$defs/${target.name}` },
            cardinality: values.through ? 'many' : 'one',
            ...(values.through
                ? { through: values.through, paginated: true, stored: false }
                : { field: property.name, nullable: propertyType !== checker.getTypeOfSymbolAtLocation(property, property.valueDeclaration) }),
        },
    };
}
for (const declaration of classes) {
    const entityAnnotation = annotations(declaration).find(item => item.name === 'EntityType');
    if (!entityAnnotation) continue;
    const name = declaration.name.text;
    const labelOptions = entityAnnotation.arguments[0];
    const labelProperty = labelOptions && ts.isObjectLiteralExpression(labelOptions)
        ? labelOptions.properties.find(item => ts.isPropertyAssignment(item) && item.name.getText() === 'label')
        : undefined;
    if (!labelProperty || !ts.isStringLiteral(labelProperty.initializer)) {
        throw new Error(`${name} needs a literal label.`);
    }
    const type = checker.getTypeAtLocation(declaration);
    const base = checker.getBaseTypes(type)[0];
    if (base?.symbol.name === 'Entity') {
        const reserved = new Set(checker.getPropertiesOfType(base).map(property => property.name));
        for (const member of declaration.members) {
            const key = member.name && (ts.isStringLiteral(member.name) ? member.name.text : member.name.getText());
            if (reserved.has(key)) throw new Error(`${name}.${key} redeclares a reserved system field.`);
        }
    }
    const repository = classes.find(item => item.name?.text === `${name}Repository`);
    const persisted = Boolean(repository);
    const expectedRepositoryPath = declaration.getSourceFile().fileName.replace(/\.ts$/, '-repository.ts');
    if (persisted && repository.getSourceFile().fileName !== expectedRepositoryPath) {
        throw new Error(`${name} needs its matching repository file and class.`);
    }
    const repositoryBase = repository && checker.getBaseTypes(checker.getTypeAtLocation(repository))[0];
    const target = repositoryBase && checker.getTypeArguments(repositoryBase)[0];
    if (repository && (repositoryBase?.symbol.name !== 'Repository' || target?.symbol !== type.symbol)) {
        throw new Error(`${name}Repository must extend Repository<${name}>.`);
    }
    const members = checker.getPropertiesOfType(type);
    for (const property of members) {
        const propertyType = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(property, property.valueDeclaration));
        if ((propertyType.symbol === referenceSymbol || propertyType.symbol === pageSymbol) && !relationshipFor(property)) {
            throw new Error(`${name}.${property.name} needs @References metadata.`);
        }
    }
    const relationships = Object.fromEntries(members.flatMap(property => {
        const relationship = relationshipFor(property);
        return relationship ? [[relationship.name, relationship.definition]] : [];
    }));
    if (!persisted && Object.keys(relationships).length) {
        throw new Error(`${name}: embedded types cannot declare relationships in this prototype.`);
    }
    const properties = Object.fromEntries(members.filter(property =>
        relationshipFor(property)?.definition.cardinality !== 'many').map(property => [
        property.name, propertySchema(property),
    ]));
    const repositoryType = repository && checker.getTypeAtLocation(repository);
    const actions = Object.fromEntries((repositoryType ? checker.getPropertiesOfType(repositoryType) : []).map(method => {
        const methodDeclaration = method.valueDeclaration;
        const actionAnnotation = annotations(methodDeclaration).find(item => item.name === 'Action');
        if (method.name !== 'create' && !actionAnnotation) throw new Error(`Expose ${method.name} using @Action.`);
        if (method.name !== 'create' && !ts.isTypeLiteralNode(methodDeclaration.parameters[0].type)) {
            throw new Error('Authored action inputs must be inline objects.');
        }
        if (method.name === 'create' && methodDeclaration.parent === repository) {
            const body = methodDeclaration.body;
            const statement = body?.statements[0];
            const call = statement && ts.isReturnStatement(statement) && statement.expression;
            if (body.statements.length !== 1 || !call || !ts.isCallExpression(call)
                || call.expression.getText() !== 'super.create' || call.arguments.length !== 1
                || call.arguments[0].getText() !== methodDeclaration.parameters[0].name.getText()) {
                throw new Error('Create override must only return super.create(input).');
            }
        }
        const signatures = checker.getTypeOfSymbolAtLocation(method, repository).getCallSignatures();
        if (signatures.length !== 1) throw new Error('Prototype actions require one signature.');
        const signature = signatures[0];
        if (signature.parameters.length !== 1) throw new Error('Actions require one input object.');
        const inputType = checker.getTypeOfSymbolAtLocation(signature.parameters[0], repository);
        const inputProperties = Object.fromEntries(checker.getPropertiesOfType(inputType).map(property => [
            property.name, propertySchema(property),
        ]));
        const outputType = checker.getAwaitedType(signature.getReturnType());
        const metadata = {};
        if (actionAnnotation) for (const property of actionAnnotation.arguments[0].properties) {
            if (!ts.isPropertyAssignment(property) || !ts.isStringLiteral(property.initializer)) throw new Error('Action metadata must be literal.');
            metadata[property.name.getText() === 'label' ? 'title' : property.name.getText()] = property.initializer.text;
        }
        return [method.name, {
            ...metadata,
            input: {
                type: 'object',
                additionalProperties: false,
                required: Object.keys(inputProperties),
                properties: inputProperties,
            },
            output: schemaFor(outputType),
            ...compileRules(methodDeclaration),
        }];
    }));
    definitions[name] = {
        title: labelProperty.initializer.text,
        type: 'object',
        additionalProperties: false,
        required: Object.keys(properties),
        properties,
        ...(persisted ? { actions, relationships } : {}),
    };
}

for (const [name, definition] of Object.entries(definitions)) {
    for (const relationship of Object.values(definition.relationships ?? {})) {
        const targetName = relationship.target.$ref.split('/').at(-1);
        const target = definitions[targetName];
        if (!target?.actions) throw new Error(`Relationship target ${targetName} must have a repository.`);
        if (relationship.through && !Object.values(target.relationships ?? {}).some(inverse =>
            inverse.field === relationship.through && inverse.target.$ref === `#/$defs/${name}`)) {
            throw new Error(`${name}: reverse relationship must match a reference on ${targetName}.`);
        }
    }
}

definitions.EntityReference = {
    title: 'Entity reference', type: 'object', additionalProperties: false,
    required: ['_id'], properties: { _id: { type: 'string' } },
};
const schemaDocument = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Poseidon application schema',
    $defs: definitions,
};
function checkReferences(value) {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
        if (['$ref', 'field', 'action'].includes(key) && typeof child === 'string' && child.startsWith('#/')) {
            const target = child.slice(2).split('/').reduce((current, part) => current?.[part], schemaDocument);
            if (!target) throw new Error(`Unresolved generated reference: ${child}`);
        }
        checkReferences(child);
    }
}
checkReferences(schemaDocument);

const emitted = program.emit(undefined, undefined, undefined, undefined, { before: [stripMetadata] });
if (emitted.emitSkipped) throw new Error('JavaScript emission failed.');
const output = join(root, 'output');
mkdirSync(output, { recursive: true });
writeFileSync(join(output, 'definitions.json'), JSON.stringify(schemaDocument, null, 2) + '\n');
writeFileSync(join(output, 'javascript/package.json'), '{ "type": "module" }\n');
console.log(`Compiled ${Object.keys(definitions).join(', ')}.`);
console.log('JavaScript: output/javascript/');
console.log('Definitions: output/definitions.json');

function stripMetadata(context) {
    return source => {
        const runtimeSymbols = new Set();
        function collect(node, inMetadata = false) {
            if (ts.isExpressionWithTypeArguments(node) && ts.isHeritageClause(node.parent)
                && node.parent.token === ts.SyntaxKind.ExtendsKeyword) {
                collect(node.expression, inMetadata);
                return;
            }
            if (ts.isImportDeclaration(node) || ts.isTypeNode(node)) return;
            const metadata = inMetadata || ts.isDecorator(node);
            if (ts.isIdentifier(node)) {
                const symbol = checker.getSymbolAtLocation(node);
                if (symbol && !metadata) runtimeSymbols.add(symbol);
            }
            ts.forEachChild(node, child => collect(child, metadata));
        }
        collect(source);
        function keepBinding(name) {
            const symbol = checker.getSymbolAtLocation(name);
            return runtimeSymbols.has(symbol);
        }
        function visit(node) {
            if (ts.isDecorator(node)) return undefined;
            if (ts.isImportDeclaration(node) && node.importClause) {
                const clause = node.importClause;
                if (clause.isTypeOnly) return undefined;
                const name = clause.name && keepBinding(clause.name) ? clause.name : undefined;
                let bindings = clause.namedBindings;
                if (bindings && ts.isNamedImports(bindings)) {
                    const elements = bindings.elements.filter(item => keepBinding(item.name));
                    bindings = elements.length ? context.factory.updateNamedImports(bindings, elements) : undefined;
                } else if (bindings && !keepBinding(bindings.name)) bindings = undefined;
                if (!name && !bindings) return undefined;
                return context.factory.updateImportDeclaration(node, node.modifiers,
                    context.factory.updateImportClause(clause, clause.isTypeOnly, name, bindings),
                    node.moduleSpecifier, node.attributes);
            }
            return ts.visitEachChild(node, visit, context);
        }
        return ts.visitNode(source, visit);
    };
}
