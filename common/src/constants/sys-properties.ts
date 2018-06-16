const SysProperties = {
    _id: "_id",
    name: "name",
    changedBy: "changedBy",
    changedOn: "changedOn",
    createdBy: "createdBy",
    createdOn: "createdOn",
    ref: "ref",
    label: "label",
    entityType: "entityType",
    schema: "schema",
    login: "login"
};

type SysProperties = (typeof SysProperties)[keyof typeof SysProperties];

export { SysProperties };
