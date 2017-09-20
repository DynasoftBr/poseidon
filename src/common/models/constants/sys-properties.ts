import { EntityProperty } from "../";

const SysProperties = {
    createdBy: <EntityProperty>{
        "_id" : "changedBy",
        "name" : "changedBy",
        "validation" : {
            "type" : "linkedEntity",
            "required" : false,
            "ref" : {
                "_id" : "user",
                "name" : "user",
                "label" : "User"
            },
            "linkedProperties" : [ 
                {
                    "_id" : "_id",
                    "name" : "_id",
                    "label" : "Id",
                    "keepUpToDate" : true
                }, 
                {
                    "_id" : "name",
                    "name" : "name",
                    "label" : "Name",
                    "keepUpToDate" : true
                }
            ]
        }
    },
    createdAt: <EntityProperty>{
        "_id" : "createdAt",
        "name" : "createdAt",
        "validation" : {
            "type" : "dateTime",
            "required" : true,
            "default" : "[[NOW]]"
        }
    },
    changedBy: <EntityProperty>{
        "_id" : "changedBy",
        "name" : "changedBy",
        "validation" : {
            "type" : "linkedEntity",
            "required" : false,
            "ref" : {
                "_id" : "user",
                "name" : "user",
                "label" : "User"
            },
            "linkedProperties" : [ 
                {
                    "_id" : "_id",
                    "name" : "_id",
                    "label" : "Id",
                    "keepUpToDate" : true
                }, 
                {
                    "_id" : "name",
                    "name" : "name",
                    "label" : "Name",
                    "keepUpToDate" : true
                }
            ]
        }
    },
    changedAt: <EntityProperty>{
        "_id" : "changedAt",
        "name" : "changedAt",
        "validation" : {
            "type" : "dateTime"
        }
    },
    _id: <EntityProperty>{
        "_id" : "createdAt",
        "name" : "createdAt",
        "validation" : {
            "type" : "dateTime",
            "required" : true,
            "default" : "[[NOW]]"
        }
    },
    _version: <EntityProperty>{
        "_id" : "_version",
        "name" : "_version",
        "validation" : {
            "type" : "integer",
            "required" : true,
            "min" : 1
        }
    }
};

export { SysProperties };
