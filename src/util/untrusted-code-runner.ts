import { VM, VMScript } from "vm2";

export class UntrustedCodeRunner<TParams = any, TResponse = any> {
    private script: VMScript;

    constructor(code: string) {
        this.script = new VMScript(code);
    }


    public async run(params: TParams): Promise<TResponse> {
        const vm = new VM({
            timeout: 60000,
            sandbox: params
        });

        return vm.run(this.script);
    }

}