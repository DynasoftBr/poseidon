import { RepositoryFactory, InMemoryStorage, DatabasePopulator, EntityType, ServiceFactory, BuiltInEntries } from "../../src";
import { PropertyTypes, SysEntities, SysProperties } from "../../src/constants";
import { expect } from "chai";
import { describe, it } from "mocha";
import * as _ from "lodash";

import { ValidationError } from "../../src/data/validation/validation-error";

describe("Entity Type Service Test", () => {

    let repositoryFactory: RepositoryFactory;

    before(async () => {
        const storage = new InMemoryStorage();
        await storage.connect();

        const populator = new DatabasePopulator(storage);
        await populator.populate();

        repositoryFactory = new RepositoryFactory(storage);
    });

    describe("Inserting one entity type", () => {
        it("During entity type's creation it gets the reserved entity properties.", async () => {

            const service = await new ServiceFactory(repositoryFactory).getEntityTypeService();
            const newEtType = <EntityType>{
                name: "NewEntityType",
                label: "New Entity Type",
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.string
                        }
                    }
                ]
            };

            const builtin = new BuiltInEntries();
            const result = await service.insertOne(newEtType);
            const reqProps = [
                builtin.idPropertyDefinition.name,
                builtin.createdAtPropertyDefinition.name,
                builtin.createdByPropertyDefinition.name,
                builtin.changedAtPropertyDefinition.name,
                builtin.changedByPropertyDefinition.name,
                //builtin.BranchPropertyDefinition.name
            ];

            expect(result.props.map(p => p.name)).to.include.members(reqProps);

        });

        it("Entity type property with pattern must be a valid regex.", async () => {
            const service = await new ServiceFactory(repositoryFactory).getEntityTypeService();
            const newEtType = <EntityType>{
                name: "customer",
                label: "Customers",
                props: [
                    {
                        name: "name",
                        validation: {
                            type: PropertyTypes.string,
                            pattern: "|||||]["
                        }
                    }
                ]
            };

            const builtin = new BuiltInEntries();

            try {
                const result = await service.insertOne(newEtType);
            } catch (error) {
                expect(error).to.not.equal(null);
            }
        });

        it("When created an entity type can be found.", async () => {
            try {
                const service = await new ServiceFactory(repositoryFactory).getEntityTypeService();
                const newEtType = <EntityType>{
                    name: "NewEntityType",
                    label: "New Entity Type",
                    props: [
                        {
                            name: "prop1",
                            validation: {
                                type: PropertyTypes.string
                            }
                        }
                    ]
                };

                const result = await service.insertOne(newEtType);

                const found = service.findOne({ _id: result._id });

                expect(found).to.be.not.null;
            } catch (error) {
                console.log(error);
            }
        });


    });

    describe("Updating one entity type", () => {
        it("Properties of type linkedProperty must have at least an 'id' in the linked property array.", async (done) => {
            const service = await new ServiceFactory(repositoryFactory).getEntityTypeService();

            const found = await service.findOne({ _id: SysEntities.entityType });
            const prop = found.props.find((el) => el.validation.type == PropertyTypes.linkedEntity);
            _.remove(prop.validation.linkedProperties, (el) => el.name == SysProperties._id);

            try {
                await service.updateOne(SysEntities.entityType, found);
                done('Should throw an error');
            } catch (error) {
                done();
            }
        });
    });
});


