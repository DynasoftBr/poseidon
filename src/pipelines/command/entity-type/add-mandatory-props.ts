import { ICommandRequest } from "../command-request";
import * as _ from "lodash";
import { ValidationProblem, SysMsgs } from "../../../exceptions";
import { ProblemKeywords, EntityType } from "@poseidon/core-models";
import { PipelineItem } from "../../pipeline-item";
import { IResponse } from "../../response";
import { builtInEntries } from "../../../data";

export async function addMandatoryProps(request: ICommandRequest<EntityType>, next: PipelineItem): Promise<IResponse> {
  const problems: ValidationProblem[] = [];
  const entity = request.payload;
  const requiredProps = [builtInEntries.idProperty, builtInEntries.createdAtProperty, builtInEntries.changedAtProperty];
  const entityTypeProps = entity.props || [];

  requiredProps.forEach(reqProp => {
    const prop = _.find(entity.props, { name: reqProp.name });
    if (prop != null) {
      problems.push(
        new ValidationProblem(
          reqProp.name,
          ProblemKeywords.invalidMandatoryEntityProperty,
          SysMsgs.validation.invalidRequiredEntityProperty,
          reqProp.name
        )
      );
    } else {
      entityTypeProps.push(reqProp);
    }
  });

  return next(request);
}
