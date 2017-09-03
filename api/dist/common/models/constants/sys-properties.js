"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SysProperties = {
    createdBy: {
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
    createdAt: {
        "name": "created_at",
        "validation": {
            "type": "dateTime",
            "required": true,
            "default": "[[NOW]]"
        }
    },
    changedBy: {
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
    changedAt: {
        "name": "changed_at",
        "validation": {
            "type": "dateTime",
            "default": "[[NOW]]"
        }
    },
    _id: {
        "name": "_id",
        "validation": {
            "type": "string",
            "required": true,
            "max": 32,
            "min": 1
        }
    }
};
exports.SysProperties = SysProperties;
//# sourceMappingURL=sys-properties.js.map