declare const SysEntities: {
    entityType: string;
    entityProperty: string;
    validation: string;
    ref: string;
    linkedProperty: string;
    user: string;
};
declare type SysEntities = (typeof SysEntities)[keyof typeof SysEntities];
export { SysEntities };
