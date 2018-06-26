const SysProperties = {
    _id: "_id",
    name: "name",
    abstract: "abstract",
    props: "props",
    changedBy: "changedBy",
    changedAt: "changedAt",
    createdBy: "createdBy",
    createdAt: "createdAt",
    ref: "ref",
    label: "label",
    entityType: "entityType",
    schema: "schema",
    login: "login",
    validation: "validation",
    type: "type",
    required: "required",
    min: "min",
    max: "max",
    pattern: "pattern",
    enum: "enum",
    linkedProperties: "linkedProperties",
    items: "items",
    uniqueItems: "uniqueItems",
    multipleOf: "multipleOf",
    default: "default",
    convention: "convention",
    keepUpToDate: "keepUpToDate"
};

type SysProperties = (typeof SysProperties)[keyof typeof SysProperties];

export { SysProperties };
