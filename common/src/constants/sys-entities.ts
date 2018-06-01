const SysEntities = {
    entityType: "entity_type",
    entityProperty: "entity_property",
    entitySchema: "entity_schema",
    validation: "validation",
    ref: "ref",
    linkedProperty: "linked_property",
    user: "user"
};

type SysEntities = (typeof SysEntities)[keyof typeof SysEntities];

export { SysEntities };
