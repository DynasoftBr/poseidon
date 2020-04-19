import { Interpreter } from "./interpreter";
import { IMatch } from "../../../../poseidon-query-builder/query-model";

export class MatchInterpreter implements Interpreter {
  constructor(private match: IMatch) {}

  async interpret() {
    return [{ $match: this.match }];
  }
}
