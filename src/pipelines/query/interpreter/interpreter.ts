export interface Interpreter {
  interpret(): Promise<any[]>;
}
