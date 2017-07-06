// import { Db, MongoClient, Collection, ObjectID } from "mongodb";

// import { PropertyType, User, EntityType, EntityProperty } from "../models/";

// export class Populate {
//     static Populate() {
//         const user = <User>{};
//         user._id = new ObjectID().toHexString();
//         user.created_at = new Date();
//         user.created_by = user.login = user.pass = "root";

//         // ============================================================================================
//         // ==========================entity_type=======================================================
//         // ============================================================================================
//         const entity_type = <EntityType>{
//             _id: "entity_type",
//             name: "entity_type",
//             created_at: new Date(),
//             created_by: user.login,
//             props: [
//                 {
//                     name: "_id",
//                     type: PropertyType.String
//                 },
//                 {
//                     name: "name",
//                     type: PropertyType.String,
//                 },
//                 {
//                     name: "abstract",
//                     type: PropertyType.Boolean,
//                 },
//                 {
//                     name: "props",
//                     type: PropertyType.Array,
//                     arrayType: "entity_property"
//                 },
//                 {
//                     name: "created_at",
//                     type: PropertyType.Date,
//                 },
//                 {
//                     name: "created_by",
//                     type: PropertyType.Ref,
//                     linkedEntity: "user/login"
//                 }
//             ]
//         };

//         // ============================================================================================
//         // ==========================entity_type_user==================================================
//         // ============================================================================================
//         const entity_type_user = <EntityType>{
//             _id: "user",
//             name: "user",
//             created_at: new Date(),
//             created_by: user.login,
//             props: [
//                 {
//                     name: "_id",
//                     type: PropertyType.String
//                 },
//                 {
//                     name: "login",
//                     type: PropertyType.String
//                 },
//                 {
//                     name: "pass",
//                     type: PropertyType.String
//                 },
//                 {
//                     name: "created_at",
//                     type: PropertyType.Date,
//                 },
//                 {
//                     name: "created_by",
//                     type: PropertyType.Ref,
//                     linkedEntity: "user/login"
//                 }
//             ]
//         };

//         // ============================================================================================
//         // ==========================entity_type_property==================================================
//         // ============================================================================================
//         const entity_type_property = <EntityType>{
//             _id: "entity_property",
//             name: "entity_property",
//             abstract: true,
//             created_at: new Date(),
//             created_by: user.login,
//             props: [
//                 {
//                     name: "_id",
//                     type: PropertyType.String
//                 },
//                 {
//                     name: "name",
//                     type: PropertyType.String
//                 },
//                 {
//                     name: "refProp",
//                     type: PropertyType.String
//                 },
//                 {
//                     name: "arrayType",
//                     type: PropertyType.Ref,
//                     linkedEntity: "entity_type/name"
//                 },
//                 {
//                     name: "created_at",
//                     type: PropertyType.Date,
//                 },
//                 {
//                     name: "created_by",
//                     type: PropertyType.Ref,
//                     linkedEntity: "user/login"
//                 }
//             ]
//         };


//         MongoClient.connect("mongodb://localhost:27017/poseidon_dev", (err, db) => {
//             if (err)
//                 throw err;
//             else {
//                 console.log("inserindo entity types");

//                 const entity_types = [
//                     entity_type_user,
//                     entity_type,
//                     entity_type_property
//                 ];

//                 db.collection("entity_type").insertMany(entity_types, (err: any, res: any) => {
//                     console.log({ error: err, res: res });
//                 });

//                 console.log("inserindo usuários");

//                 db.collection("user").insertMany([
//                     user
//                 ], (err: any, res: any) => {
//                     console.log({ error: err, res: res });
//                 });
//             }
//         });
//     }
// }