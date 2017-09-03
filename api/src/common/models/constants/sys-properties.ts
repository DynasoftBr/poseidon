import { EntityProperty } from "../";

const SysProperties = {
    createdBy: <EntityProperty>{
        "name": "created_by",
        "validation": {
            "type": "linkedEntity",
            "required": true,
            "ref": {
                "_id": "user",
                "name": "user",
                "label": "User"
            },
            "linkedProperties": [
                {
                    "name": "_id",
                    "label": "Id",
                    "keepUpToDate": true
                },
                {
                    "name": "name",
                    "label": "Name",
                    "keepUpToDate": true
                }
            ]
        }
    },
    createdAt: <EntityProperty>{
        "name": "created_at",
        "validation": {
            "type": "dateTime",
            "required": true,
            "default": "[[NOW]]"
        }
    },
    changedBy: <EntityProperty>{
        "name": "changed_by",
        "validation": {
            "type": "linkedEntity",
            "required": false,
            "ref": {
                "_id": "user",
                "name": "user",
                "label": "User"
            },
            "linkedProperties": [
                {
                    "name": "_id",
                    "label": "Id",
                    "keepUpToDate": true
                },
                {
                    "name": "name",
                    "label": "Name",
                    "keepUpToDate": true
                }
            ]
        }
    },
    changedAt: <EntityProperty>{
        "name": "changed_at",
        "validation": {
            "type": "dateTime",
            "default": "[[NOW]]"
        }
    },
    _id: <EntityProperty>{
        "name": "_id",
        "validation": {
            "type": "string",
            "required": true,
            "max": 32,
            "min": 1
        }
    }
};

export { SysProperties };
