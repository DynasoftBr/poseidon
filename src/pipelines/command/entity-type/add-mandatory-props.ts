import { ICommandRequest } from "../command-request";
import { BuiltInEntries } from "../../../data";
import * as _ from "lodash";
import { ValidationProblem, SysMsgs } from "../../../exceptions";
import { ProblemKeywords, IEntityType } from "@poseidon/core-models";
import { PipelineItem } from "../../pipeline-item";
import { IResponse } from "../../response";

export async function addMandatoryProps(request: ICommandRequest<IEntityType>, next: PipelineItem): Promise<IResponse> {
  const problems: ValidationProblem[] = [];
  const entity = request.payload;
  const buildIn = BuiltInEntries.build();
  const requiredProps = [buildIn.idProperty, buildIn.createdAtProperty, buildIn.changedAtProperty];
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
