import { EntityType, EntityProperty } from "../models";
import { SysEntities, SysProperties, PropertyTypes } from "../constants";
import { UserRef } from "../models/helpers";
import { SysUsers } from "../constants/sys-users";
import { userInfo } from "os";

export class BuiltInEntries {
    entityType(): EntityType {
        return {
            _id: SysEntities.entityType,
            name: SysEntities.entityType,
            abstract: false,
            props: [
                this.idPropertyDefination(),
                this.changedByPropertyDefination(),
                this.createdOnPropertyDefination(),
                this.changedByPropertyDefination(),
                this.changedOnPropertyDefination()
            ],
            created_by: this.rootUserRef(),
            created_at: new Date()
        };
    }

    idPropertyDefination(): EntityProperty {
        return {
            name: SysProperties._id,
            validation: {
                type: PropertyTypes.string,
                required: true,
                unique: true
            }
        };
    }

    createdByPropertyDefination(): EntityProperty {
        return {
            name: SysProperties.createdBy,
            validation: {
                type: PropertyTypes.linkedEntity,
                required: true,
                ref: {
                    _id: SysEntities.user,
                    name: SysEntities.user
                },
                linkedProperties: [
                    {
                        name: SysProperties._id,
                        label: SysProperties._id,
                        keepUpToDate: true
                    },
                    {
                        name: SysProperties.name,
                        label: SysProperties.name,
                        keepUpToDate: true
                    }
                ]
            }
        };
    }

    createdOnPropertyDefination(): EntityProperty {
        return {
            name: SysProperties.createdOn,
            validation: {
                type: PropertyTypes.dateTime,
                required: true
            }
        };
    }

    changedByPropertyDefination(): EntityProperty {
        return {
            name: SysProperties.changedBy,
            validation: {
                type: PropertyTypes.linkedEntity,
                required: false,
                ref: {
                    _id: SysEntities.user,
                    name: SysEntities.user
                },
                linkedProperties: [
                    {
                        name: SysProperties._id,
                        label: SysProperties._id,
                        keepUpToDate: true
                    },
                    {
                        name: SysProperties.name,
                        label: SysProperties.name,
                        keepUpToDate: true
                    }
                ]
            }
        };
    }

    changedOnPropertyDefination(): EntityProperty {
        return {
            name: SysProperties.changedOn,
            validation: {
                type: PropertyTypes.dateTime,
                required: false
            }
        };
    }

    rootUserRef(): UserRef {
        return {
            _id: SysUsers.root,
            name: SysUsers.root
        };
    }
}