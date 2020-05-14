import { Entity, EntityType, EntityTypePipelineItems, SysEntities } from "@poseidon/core-models";
import { RequestPipeline } from "../request-pipeline";
import { PipelineItem } from "../pipeline-item";
import { addMandatoryProps } from "./entity-type/add-mandatory-props";
import { validateMandatoryProps } from "./entity-type/validate-mandatory-props";
import { ICommandRequest } from "./command-request";
import UntrustedCodeRunner from "../../util/untrusted-code-runner";
import { Context } from "../../data/context";
import { applyDefaultsAndConvention } from "./common/apply-defaults-and-convention";
import { validateSchema } from "./common/validate-schema";
import { publishDomainEvent } from "./common/publish-domain-event";
import { AddCreationInfo } from "./common/add-creation-info";
import { AssignIdentity } from "./common/assign-identity";

export class CommandPipeline<T extends any = any, TResponse extends Entity = Entity> extends RequestPipeline<T, TResponse> {
  private static SysEntitiesItems = Object.values(SysEntities) as string[];

  constructor(context: Context, entityType: EntityType, payload: any, handlers: PipelineItem<T, TResponse>[]) {
    super({ context, entityType, payload } as ICommandRequest, handlers);
  }

  public static async create(context: Context, entityType: EntityType, commandName: string, payload: any) {
    const command = entityType.commands.find((c) => c.name === commandName);
    let customPipelineItems = null;

    if (this.SysEntitiesItems.includes(entityType.name)) {
      switch (entityType.name) {
        case SysEntities.entityType:
          customPipelineItems = this.buildEntityTypeCommandPipeline(entityType, commandName);
          break;

        default:
          throw "Not implemented";
      }
    } else {
      customPipelineItems = command.pipeline.map((item) => async (_request: ICommandRequest, _next: PipelineItem) => {
        const untrustedFunc = (await UntrustedCodeRunner.run<any>(item.code, null, true)).default as PipelineItem;
        return untrustedFunc(_request, async (r) => _next(r));
      });
    }

    return new CommandPipeline(context, entityType, payload, [
      ...customPipelineItems,
      applyDefaultsAndConvention,
      AssignIdentity,
      AddCreationInfo,
      validateSchema,
      publishDomainEvent,
    ]);
  }

  private static buildEntityTypeCommandPipeline(entityType: EntityType, commandName: string): PipelineItem[] {
    const command = entityType.commands.find((c) => c.name === commandName);

    return command.pipeline.map((item) => {
      switch (item.name) {
        case EntityTypePipelineItems.AddMandatoryPropeties:
          return addMandatoryProps;

        case EntityTypePipelineItems.ValidateMandatoryPropeties:
          return validateMandatoryProps;

        default:
          return async (_request: ICommandRequest, _next: PipelineItem) => {
            const untrustedFunc = (await UntrustedCodeRunner.run<any>(item.code, null, true)).default as PipelineItem;
            return untrustedFunc(_request, async (r) => _next(r));
          };
      }
    });
  }
}
