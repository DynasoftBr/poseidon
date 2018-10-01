import * as util from "util";
import {
    ErrorObject, LimitParams, AdditionalPropertiesParams,
    ComparisonParams, MultipleOfParams, RequiredParams,
    TypeParams, UniqueItemsParams, PatternParams
} from "ajv";
import { SysMsgs, SysMsg } from "../../";
import { ProblemKeywords } from "../../constants";

export class ValidationProblem {

    code: number;
    message: string;
    constructor(public property: string, public keyword: ProblemKeywords, sysMsg: SysMsg, ...params: any[]) {
        this.code = sysMsg.code;
        this.message = util.format(sysMsg.message, ...params);
    }

    static buildMsg(err: ErrorObject): ValidationProblem {
        let dtPath = err.dataPath.replace(/\./, "");

        switch (err.keyword) {
            case ProblemKeywords.minLength:
                return new ValidationProblem(dtPath, err.keyword,
                    SysMsgs.validation.minLength, dtPath, (<LimitParams>err.params).limit);

            case ProblemKeywords.maxLength:
                return new ValidationProblem(dtPath, err.keyword,
                    SysMsgs.validation.maxLength, dtPath, (<LimitParams>err.params).limit);

            case ProblemKeywords.maxItems:
                return new ValidationProblem(dtPath, err.keyword,
                    SysMsgs.validation.maxItems, dtPath, (<LimitParams>err.params).limit);

            case ProblemKeywords.minItems:
                return new ValidationProblem(dtPath, err.keyword,
                    SysMsgs.validation.minItems, dtPath, (<LimitParams>err.params).limit);

            case ProblemKeywords.additionalProperties:
                dtPath = (dtPath === "" ? "" : dtPath + ".") + (<AdditionalPropertiesParams>err.params).additionalProperty;
                return new ValidationProblem(dtPath, err.keyword,
                    SysMsgs.validation.additionalProperties,
                    dtPath);

            case ProblemKeywords.format:
                return new ValidationProblem(dtPath, err.keyword, SysMsgs.validation.dateFormat);

            case ProblemKeywords.minimum:
                return new ValidationProblem(dtPath, err.keyword,
                    SysMsgs.validation.minimum, dtPath, (<ComparisonParams>err.params).limit);

            case ProblemKeywords.maximum:
                return new ValidationProblem(dtPath, err.keyword,
                    SysMsgs.validation.maximum, dtPath, (<ComparisonParams>err.params).limit);

            case ProblemKeywords.multipleOf:
                return new ValidationProblem(dtPath, err.keyword,
                    SysMsgs.validation.multipleOf, dtPath, (<MultipleOfParams>err.params).multipleOf);

            case ProblemKeywords.pattern:
                return new ValidationProblem(dtPath, err.keyword,
                    SysMsgs.validation.pattern, dtPath, (<PatternParams>err.params).pattern);

            case ProblemKeywords.required:
                dtPath = (dtPath === "" ? "" : dtPath + ".") + (<RequiredParams>err.params).missingProperty;
                return new ValidationProblem(dtPath, err.keyword,
                    SysMsgs.validation.required, dtPath);

            case ProblemKeywords.type:
                return new ValidationProblem(dtPath, err.keyword,
                    SysMsgs.validation.type, (<TypeParams>err.params).type);

            case ProblemKeywords.uniqueItems:
                return new ValidationProblem(dtPath, err.keyword,
                    SysMsgs.validation.uniqueItems, dtPath, (<UniqueItemsParams>err.params).i,
                    (<UniqueItemsParams>err.params).j);

            case ProblemKeywords.enum:
                return new ValidationProblem(dtPath, err.keyword,
                    SysMsgs.validation.enum, dtPath, (<UniqueItemsParams>err.params).i,
                    (<UniqueItemsParams>err.params).j);
        }
    }

    toJSON() {
        return {
            property: this.property,
            keyword: this.keyword,
            code: this.code,
            message: this.message
        };
    }
}