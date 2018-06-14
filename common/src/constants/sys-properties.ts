const SysProperties = {
    _id: "_id",
    name: "name",
    changedBy: "changedBy",
    changedOn: "changedOn",
    createdBy: "createdBy",
    createdOn: "createdOn",
    ref: "ref",
    label: "label"
};

type SysProperties = (typeof SysProperties)[keyof typeof SysProperties];

export { SysProperties };
