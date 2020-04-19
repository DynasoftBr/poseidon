import { Interpreter } from "./interpreter";
import { IRepository } from "../../../data";
import { IEntityType } from "@poseidon/core-models";
import { IQueryModel } from "../../../../poseidon-query-builder/query-model";
import { MatchInterpreter } from "./match-interpreter";
import { IncludeInterpreter } from "./include-interpreter";

export class PoseidonToMongoDbQueryInterpreter implements Interpreter {
  private pipelineInterpreters: Interpreter[] = [];

  constructor(private repo: IRepository<IEntityType>, private entityType: IEntityType, private obj: IQueryModel) {}

  async interpret() {
    if (this.obj.$match) this.pipelineInterpreters.push(new MatchInterpreter(this.obj.$match));
    if (this.obj.$include) {
      for (const key in this.obj.$include) {
        this.pipelineInterpreters.push(new IncludeInterpreter(this.repo, this.entityType, key, this.obj.$include[key]));
      }
    }

    const result: any[] = [];
    for (const interpreter of this.pipelineInterpreters) {
      result.push(...(await interpreter.interpret()));
    }

    return result;
  }
}
