"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_1 = require("../../../data");
const core_models_1 = require("@poseidon/core-models");
const _ = require("lodash");
function ValidateMandatoryProps(request, next) {
    const builtin = new data_1.BuiltInEntries();
    const { entity } = request;
    if (_.filter(entity.props, { name: core_models_1.SysProperties.changedAt })
        .length == 0)
        entity.props.push(builtin.changedAtPropertyDefinition);
    if (_.filter(entity.props, { name: core_models_1.SysProperties.changedBy })
        .length == 0)
        entity.props.push(builtin.changedByPropertyDefinition);
    if (_.filter(entity.props, { name: core_models_1.SysProperties.createdAt })
        .length == 0)
        entity.props.push(builtin.createdAtPropertyDefinition);
    if (_.filter(entity.props, { name: core_models_1.SysProperties.createdBy })
        .length == 0)
        entity.props.push(builtin.createdByPropertyDefinition);
    if (_.filter(entity.props, { name: core_models_1.SysProperties._id })
        .length == 0)
        entity.props.push(builtin.idPropertyDefinition);
    next(request);
}
exports.ValidateMandatoryProps = ValidateMandatoryProps;
//# sourceMappingURL=validate-mandatory-props.js.map