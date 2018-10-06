const SysEntities = {
    entityType: "EntityType",
    entityProperty: "EntityProperty",
    entitySchema: "EntitySchema",
    validation: "Validation",
    entitybranch:"EntityBranch",
    ref: "Ref",
    linkedProperty: "LinkedProperty",
    user: "User"
};

type SysEntities = (typeof SysEntities)[keyof typeof SysEntities];

export { SysEntities };
