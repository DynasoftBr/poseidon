import path from 'node:path';
import ts from 'typescript';

function compile(source: string): ts.Diagnostic[] {
    const filename = path.resolve('src/__tests__/standard-decorator-types.virtual.ts');
    const options: ts.CompilerOptions = {
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        target: ts.ScriptTarget.ES2023,
        module: ts.ModuleKind.CommonJS,
    };
    const host = ts.createCompilerHost(options);
    const getSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (file, languageVersion) =>
        file === filename
            ? ts.createSourceFile(file, source, languageVersion, true)
            : getSourceFile(file, languageVersion);
    const program = ts.createProgram([filename], options, host);
    return ts
        .getPreEmitDiagnostics(program)
        .filter((diagnostic) => diagnostic.file?.fileName === filename);
}

const declarations = `
    import type { EntityRef, PaginatedList } from '@poseidon/utilities';
    import { Entity, EntityTypeDef, HasMany, HasOne } from '../index';

    @EntityTypeDef()
    class User extends Entity {
        @HasMany(() => Ticket, (ticket) => ticket.creator)
        tickets!: PaginatedList<Ticket>;
    }

    @EntityTypeDef()
    class Ticket extends Entity {
        @HasOne(() => User, (user) => user.tickets)
        creator!: EntityRef<User>;
    }
`;

describe('relationship decorator types', () => {
    it('should accept matching relationship field and target types', () => {
        expect(compile(declarations)).toEqual([]);
    });

    it.each([
        `
            @EntityTypeDef()
            class InvalidOne extends Entity {
                @HasOne(() => User, (user) => user.tickets)
                users!: PaginatedList<User>;
            }
        `,
        `
            @EntityTypeDef()
            class InvalidMany extends Entity {
                @HasMany(() => Ticket, (ticket) => ticket.creator)
                user!: EntityRef<Ticket>;
            }
        `,
        `
            @EntityTypeDef()
            class Customer extends Entity {}
            @EntityTypeDef()
            class InvalidTarget extends Entity {
                @HasOne(() => User, (user) => user.tickets)
                customer!: EntityRef<Customer>;
            }
        `,
    ])('should reject an incompatible relationship declaration', (declaration) => {
        expect(compile(`${declarations}\n${declaration}`)).not.toHaveLength(0);
    });
});
