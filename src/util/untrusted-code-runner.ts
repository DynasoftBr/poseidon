import { VM, VMScript, NodeVM } from "vm2";
import * as ts from "typescript";

class UntrustedCodeRunner {
  private scriptMap = new Map<string, VMScript>();

  public async run<TResponse = any>(code: string, sandbox?: any, isTs?: boolean): Promise<TResponse> {
    let script = this.scriptMap.get(code);

    if (script == null) {
      let originalCode = code;
      if (isTs) {
        originalCode = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
      }

      script = new VMScript(originalCode);
      this.scriptMap.set(originalCode, script);
    }

    const vm = new NodeVM({
      timeout: 30000,
      sandbox
    });

    return vm.run(script);
  }
}

export default new UntrustedCodeRunner();
