import { IConcreteEntity, IEntityType } from "@poseidon/core-models";
import { CommandPipeline } from "../pipelines/command/command-pipeline";
import { ICommandRequest } from "../pipelines/command/command-request";
import { IService } from "./iservice";
import { publishDomainEvent } from "../pipelines/command/common/publish-domain-event";
import { IRepositoryFactory, IRepository } from "../data";
import { applyDefaultsAndConvention } from "../pipelines/command/common/apply-defaults-and-convention";
import { validateSchema } from "../pipelines/command/common/validate-schema";

export class ConcreteEntityService<T extends IConcreteEntity> implements IService<T> {

    protected createPipeline: CommandPipeline<T>;
    protected updatePipeline: CommandPipeline<T>;
    protected deletePipeline: CommandPipeline<T>;
    protected entityType: IEntityType;

    constructor(protected repo: IRepository<T>, protected repoFactory: IRepositoryFactory) {
        this.entityType = repo.entityType;
        this.buildPipelines();
    }

    public findMany(filter: object, skip?: number, limit?: number, sort?: object): Promise<T[]> {
        return this.repo.findMany(filter, skip, limit);
    }

    public findOne(filter: object): Promise<T> {
        throw new Error("Method not implemented.");
    }

    public async create(partialEntity: Partial<T>, event?: string): Promise<T> {
        const request: ICommandRequest<T> = {
            entity: partialEntity,
            entityType: this.entityType,
            operation: "insert",
            context: null,
            eventName: event || `${this.entityType.name}_created`
        };

        await this.createPipeline.handle(request);

        return request.entity as T;
    }

    public async update(partialEntity: Partial<T>, event?: string): Promise<Partial<T>> {
        const request: ICommandRequest<T> = {
            entity: partialEntity,
            entityType: this.entityType,
            operation: "update",
            context: null,
            eventName: event || `${this.entityType.name}_updated`
        };

        await this.updatePipeline.handle(request);

        return partialEntity;
    }

    public async delete(id: string, event?: string): Promise<void> {

        const request: ICommandRequest<T> = {
            entity: { _id: id } as Partial<T>,
            entityType: this.entityType,
            operation: "delete",
            context: null,
            eventName: event || `${this.entityType.name}_deleted`
        };

        return this.deletePipeline.handle(request);
    }

    public executeCommand<T = any>(command: string, params: any): Promise<T> {
        throw new Error("Method not implemented.");
    }

    protected buildPipelines(): void {
        const createHandlers = [
            applyDefaultsAndConvention,
            validateSchema,
            publishDomainEvent
        ];
        this.createPipeline = new CommandPipeline<T>(createHandlers);

        const updateHandlers = [
            applyDefaultsAndConvention,
            validateSchema,
            publishDomainEvent
        ];
        this.updatePipeline = new CommandPipeline<T>(updateHandlers);


        const deleteHandlers = [
            publishDomainEvent
        ];
        this.deletePipeline = new CommandPipeline<T>(deleteHandlers);

    }
}