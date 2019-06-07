"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_1 = require("../../../data");
const _ = require("lodash");
const exceptions_1 = require("../../../exceptions");
function AddMandatoryProps(request, next) {
    const problems = request.problems = request.problems || [];
    const entity = request.entity;
    const buildIn = new data_1.BuiltInEntries();
    const requiredProps = [
        buildIn.idPropertyDefinition,
        buildIn.createdAtPropertyDefinition,
        buildIn.createdByPropertyDefinition,
        buildIn.changedAtPropertyDefinition,
        buildIn.changedByPropertyDefinition
    ];
    requiredProps.forEach((reqProp) => {
        const prop = _.find(entity.props, { name: reqProp.name });
        if (prop == null)
            problems.push(new exceptions_1.ValidationProblem(reqProp.name, "missingRequiredEntityProperty", exceptions_1.SysMsgs.validation.missingRequiredEntityProperty, reqProp.name));
        else if (!_.isEqual(prop, reqProp))
            problems.push(new exceptions_1.ValidationProblem(reqProp.name, "invalidRequiredEntityProperty", exceptions_1.SysMsgs.validation.invalidRequiredEntityProperty, reqProp.name));
    });
    next(request);
}
exports.AddMandatoryProps = AddMandatoryProps;
//# sourceMappingURL=add-mandatory-props.js.map