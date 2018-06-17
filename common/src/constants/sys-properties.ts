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
    login: "login"
};

type SysProperties = (typeof SysProperties)[keyof typeof SysProperties];

export { SysProperties };
