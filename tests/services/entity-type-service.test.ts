
import { PropertyTypes, SysEntities, IEntityType } from "@poseidon/core-models";
import { expect } from "chai";
import {
    IRepositoryFactory, InMemoryStorage, DatabasePopulator,
    RepositoryFactory, BuiltInEntries
} from "../../src/data";
import { EntityTypeService, ServiceFactory } from "../../src/services";

describe("Entity Type Service Test", () => {

    let repositoryFactory: IRepositoryFactory;

    before(async () => {
        const storage = new InMemoryStorage();
        await storage.connect();

        const populator = new DatabasePopulator(storage);
        await populator.populate();

        repositoryFactory = new RepositoryFactory(storage);
    });

    describe("Creating a entity type", () => {
        it("During entity type's creation it gets the required entity properties.", async () => {
            const service = <EntityTypeService>(await new ServiceFactory(repositoryFactory)
                .getByName(SysEntities.entityType));

            const newEtType = <IEntityType>{
                name: "NewEntityType",
                label: "New Entity Type",
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.string
                        }
                    }
                ],
                createdAt: undefined,
                createdBy: undefined,
                _id: undefined
            };

            const builtin = new BuiltInEntries();
            const result = await service.create(newEtType);
            const reqProps = [
                builtin.idPropertyDefinition.name,
                builtin.createdAtPropertyDefinition.name,
                builtin.createdByPropertyDefinition.name,
                builtin.changedAtPropertyDefinition.name,
                builtin.changedByPropertyDefinition.name
            ];

            expect(result.props.map(p => p.name)).to.include.members(reqProps);
        });

        it("When created an entity type can be found.", async () => {
            const service = await new ServiceFactory(repositoryFactory).getByName(SysEntities.entityType);
            const newEtType = <IEntityType>{
                name: "NewEntityType",
                label: "New Entity Type",
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.string
                        }
                    }
                ],
                createdAt: undefined,
                createdBy: undefined,
                _id: undefined
            };

            const builtin = new BuiltInEntries();
            const result = await service.create(newEtType);

            const found = service.findOne({ _id: result._id });

            expect(found).to.be.not.null;
        });

        it("When created the entity type has the required properties.", async () => {
            const service = <EntityTypeService>(await new ServiceFactory(repositoryFactory)
                .getByName(SysEntities.entityType));

            const newEtType = <IEntityType>{
                name: "NewEntityType",
                label: "New Entity Type",
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.string
                        }
                    }
                ],
                createdAt: undefined,
                createdBy: undefined,
                _id: undefined
            };

            const builtin = new BuiltInEntries();
            const result = await service.create(newEtType);
            const found = await service.findOne({ name: result.name });

            const reqProps = [
                builtin.idPropertyDefinition.name,
                builtin.createdAtPropertyDefinition.name,
                builtin.createdByPropertyDefinition.name,
                builtin.changedAtPropertyDefinition.name,
                builtin.changedByPropertyDefinition.name
            ];
            expect(found.props.map(p => p.name)).to.include.members(reqProps);
        });
    });
});