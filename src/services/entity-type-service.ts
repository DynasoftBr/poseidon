import { ConcreteEntityService } from "./concrete-entity-service";
import { IEntityType, IValidation, PropertyTypes, ProblemKeywords, SysProperties } from "@poseidon/core-models";
import { ValidationProblem, SysMsgs } from "../exceptions";
import { BuiltInEntries, IRepositoryFactory, IRepository } from "../data";
import { applyDefaultsAndConvention } from "../pipelines/command/common/apply-defaults-and-convention";
import { validateSchema } from "../pipelines/command/common/validate-schema";
import { publishDomainEvent } from "../pipelines/command/common/publish-domain-event";
import { CommandPipeline } from "../pipelines/command/command-pipeline";
import { addMandatoryProps } from "../pipelines/command/entity-type/add-mandatory-props";

export class EntityTypeService extends ConcreteEntityService<IEntityType> {

    constructor(repo: IRepository<IEntityType>, repoFactory: IRepositoryFactory) {
        super(repo, repoFactory);
    }

    protected buildPipelines() {
        const createHandlers = [
            applyDefaultsAndConvention,
            addMandatoryProps,
            validateSchema,
            publishDomainEvent
        ];
        this.createPipeline = new CommandPipeline<IEntityType>(createHandlers);
    }

    private validatePatternProperties(entity: IEntityType)
        : ValidationProblem[] {

        const problems: ValidationProblem[] = [];
        const props = entity.props;

        for (let idx = 0; idx < props.length; idx++) {
            const prop = props[idx];

            problems.push(...this.validatePattern(prop.name, prop.validation));
        }

        return problems;
    }

    private validatePattern(propName: string, validation: IValidation) {
        const problems: ValidationProblem[] = [];
        if (validation.type === PropertyTypes.string
            && validation.pattern) {
            try {
                new RegExp(validation.pattern);
            } catch (e) {
                problems.push(new ValidationProblem(propName,
                    ProblemKeywords.pattern, SysMsgs.validation.invalidPattern));
            }
        } else if (validation.type === PropertyTypes.array
            && validation.items.type === PropertyTypes.string
            && validation.items.pattern) {

            problems.push(...this.validatePattern(propName, validation));
        }

        return problems;
    }
}