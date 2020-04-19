export class InterpreterHelper {
  private static _variableCount: number = 0;
  public static get VariableCount(): number {
    return this._variableCount++;
  }
}
