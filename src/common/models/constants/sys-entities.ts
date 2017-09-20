const SysEntities = {
    entityType: "EntityType",
    entityProperty: "EntityProperty",
    validation: "validation",
    ref: "ref",
    linkedProperty: "LinkedProperty",
    user: "user"
};

type SysEntities = (typeof SysEntities)[keyof typeof SysEntities];

export { SysEntities };
