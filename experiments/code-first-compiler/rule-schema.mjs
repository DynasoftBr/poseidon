import ts from 'typescript';

export function ruleCompiler(checker, annotations) {
    function declarationOf(node) {
        let symbol = checker.getSymbolAtLocation(node);
        if (symbol?.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
        const declaration = symbol?.valueDeclaration;
        if (!declaration || !ts.isVariableDeclaration(declaration)) throw new Error(`Expected declared rule or specification: ${node.getText()}`);
        return declaration;
    }
    function object(node) {
        if (!node || !ts.isObjectLiteralExpression(node)) throw new Error('Expected literal definition object.');
        return Object.fromEntries(node.properties.map(property => {
            if (!ts.isPropertyAssignment(property)) throw new Error('Unsupported definition property.');
            return [property.name.getText(), property.initializer];
        }));
    }
    function literal(node) {
        if (ts.isStringLiteral(node)) return node.text;
        if (ts.isNumericLiteral(node)) return Number(node.text);
        if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
        if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
        if (node.kind === ts.SyntaxKind.NullKeyword) return null;
        throw new Error(`Unsupported literal: ${node.getText()}`);
    }
    function operand(node) {
        if (ts.isCallExpression(node) && node.expression.getText() === 'setting') {
            return { setting: literal(node.arguments[0]) };
        }
        return { value: literal(node) };
    }
    function condition(node) {
        if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) throw new Error('Unsupported condition.');
        const operator = node.expression.name.text;
        if (!['greaterThan', 'equals'].includes(operator)) throw new Error(`Unsupported condition operator ${operator}.`);
        const field = node.expression.expression;
        if (!ts.isCallExpression(field) || !ts.isPropertyAccessExpression(field.expression)
            || field.expression.name.text !== 'field') throw new Error('Expected specification.field.');
        const specification = declarationOf(field.expression.expression).initializer;
        if (!ts.isCallExpression(specification) || specification.expression.getText() !== 'specification') throw new Error('Expected specification<T>().');
        const entityType = checker.getTypeFromTypeNode(specification.typeArguments[0]);
        const property = literal(field.arguments[0]);
        if (!checker.getPropertyOfType(entityType, property)) throw new Error(`Unknown condition property ${property}.`);
        return {
            operator,
            left: { field: `#/$defs/${entityType.symbol.name}/properties/${property}` },
            right: operand(node.arguments[0]),
        };
    }
    function mapping(node, previousSteps) {
        if (ts.isAsExpression(node)) return mapping(node.expression, previousSteps);
        if (ts.isParenthesizedExpression(node)) return mapping(node.expression, previousSteps);
        if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(Object.entries(object(node)).map(([key, value]) => [key, mapping(value, previousSteps)]));
        if (ts.isPropertyAccessExpression(node) || ts.isIdentifier(node)) {
            const path = node.getText();
            if (path === 'input' || path.startsWith('input.')) return { from: path };
            if (path.startsWith('results.') && previousSteps.has(path.split('.')[1])) return { from: path };
            throw new Error(`Unsupported input mapping: ${path}`);
        }
        return { value: literal(node) };
    }
    function steps(node) {
        if (!ts.isCallExpression(node)) throw new Error('Expected pipeline call.');
        if (node.expression.getText() === 'pipeline') return [];
        if (!ts.isPropertyAccessExpression(node.expression) || node.expression.name.text !== 'step') throw new Error('Unsupported pipeline step.');
        const previous = steps(node.expression.expression);
        const name = literal(node.arguments[0]);
        if (previous.some(step => step.name === name)) throw new Error(`Duplicate result name ${name}.`);
        const definition = object(node.arguments[1]);
        const factory = definition.action;
        if (!ts.isArrowFunction(factory) || !ts.isPropertyAccessExpression(factory.body)) throw new Error('Expected action reference callback.');
        const target = factory.body;
        const prototype = target.expression;
        if (!ts.isPropertyAccessExpression(prototype) || prototype.name.text !== 'prototype') throw new Error('Expected Repository.prototype.action.');
        const repositoryType = checker.getTypeAtLocation(prototype);
        const base = checker.getBaseTypes(repositoryType)[0];
        const entity = checker.getTypeArguments(base)[0].symbol.name;
        const mapper = definition.input;
        if (!ts.isArrowFunction(mapper) || ts.isBlock(mapper.body)) throw new Error('Prototype supports expression input mappers only.');
        return [...previous, {
            name,
            action: `#/$defs/${entity}/actions/${target.name.text}`,
            arguments: mapping(mapper.body, new Set(previous.map(step => step.name))),
        }];
    }
    function rules(nodes) {
        if (!nodes) return {};
        if (!ts.isArrayLiteralExpression(nodes)) throw new Error('Rules must be declared in an ordered array.');
        return Object.fromEntries(nodes.elements.map((node, index) => {
            const declaration = declarationOf(node);
            const call = declaration.initializer;
            if (!ts.isCallExpression(call) || call.expression.getText() !== 'defineBusinessRule') throw new Error('Expected defineBusinessRule.');
            const definition = object(call.arguments[0]);
            return [declaration.name.getText(), {
                order: index + 1,
                title: literal(definition.label),
                description: literal(definition.description),
                when: condition(definition.when),
                actions: steps(definition.then),
            }];
        }));
    }
    return function methodRules(method) {
        const annotation = annotations(method).find(item => item.name === 'Rules');
        if (!annotation) return { before: {}, after: {} };
        const declaration = object(annotation.arguments[0]);
        return { before: rules(declaration.before), after: rules(declaration.after) };
    };
}
