import * as util from "util";
import { ErrorObject, LimitParams, AdditionalPropertiesParams, ComparisonParams, MultipleOfParams, RequiredParams, TypeParams, UniqueItemsParams } from "ajv";
import { SysMsgs, SysMsg } from "../../exceptions";

export class ValidationProblem {

    code: number;
    message: string;
    constructor(public property: string, public keyword: string, sysMsg: SysMsg, ...params: any[]) {
        this.code = sysMsg.code;
        this.message = util.format(sysMsg.message, ...params);
    }

    static buildMsg(err: ErrorObject): ValidationProblem {
        let dtPath = err.dataPath.replace(/\./, "");

        if (err.keyword === "minLength")
            return new ValidationProblem(dtPath, err.keyword,
                SysMsgs.validation.minLength, dtPath, (<LimitParams>err.params).limit);

        else if (err.keyword === "maxLength")
            return new ValidationProblem(dtPath, err.keyword,
                SysMsgs.validation.maxLength, dtPath, (<LimitParams>err.params).limit);

        else if (err.keyword === "maxItems")
            return new ValidationProblem(dtPath, err.keyword,
                SysMsgs.validation.maxItems, dtPath, (<LimitParams>err.params).limit);

        else if (err.keyword === "additionalProperties") {
            dtPath = (dtPath === "" ? "" : dtPath + ".") + (<AdditionalPropertiesParams>err.params).additionalProperty;
            return new ValidationProblem(dtPath, err.keyword,
                SysMsgs.validation.additionalProperties,
                dtPath);
        }
        else if (err.keyword === "format")
            return new ValidationProblem(dtPath, err.keyword, SysMsgs.validation.dateFormat);

        else if (err.keyword === "minimum")
            return new ValidationProblem(dtPath, err.keyword,
                SysMsgs.validation.minimum, dtPath, (<ComparisonParams>err.params).limit);

        else if (err.keyword === "maximum")
            return new ValidationProblem(dtPath, err.keyword,
                SysMsgs.validation.maximum, dtPath, (<ComparisonParams>err.params).limit);

        else if (err.keyword === "multipleOf")
            return new ValidationProblem(dtPath, err.keyword,
                SysMsgs.validation.multipleOf, dtPath, (<MultipleOfParams>err.params).multipleOf);

        else if (err.keyword === "pattern")
            return new ValidationProblem(dtPath, err.keyword,
                SysMsgs.validation.maxItems, dtPath, (<LimitParams>err.params).limit);

        else if (err.keyword === "required") {
            dtPath = (dtPath === "" ? "" : dtPath + ".") + (<RequiredParams>err.params).missingProperty;
            return new ValidationProblem(dtPath, err.keyword,
                SysMsgs.validation.required, dtPath);
        }
        else if (err.keyword === "type")
            return new ValidationProblem(dtPath, err.keyword,
                SysMsgs.validation.type, (<TypeParams>err.params).type);

        else if (err.keyword === "uniqueItems")
            return new ValidationProblem(dtPath, err.keyword,
                SysMsgs.validation.uniqueItems, dtPath, (<LimitParams>err.params).limit);

        else if (err.keyword === "enum")
            return new ValidationProblem(dtPath, err.keyword,
                SysMsgs.validation.enum, dtPath, (<UniqueItemsParams>err.params).i,
                (<UniqueItemsParams>err.params).j);
    }

    toJSON() {
        return {
            property: this.property,
            keyword: this.keyword,
            code: this.code,
            message: this.message
        }
    }
}