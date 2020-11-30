import { MongoClient } from "mongodb";
import {
  SysDatabases,
  SysEntities,
  PropertyTypes,
  EntityProperty,
  RelationLink,
  SimpleTypes,
  EntityType,
  Entity,
  SysProperties,
} from "@poseidon/core-models";
import { omit } from "lodash";
import { builtInEntries } from "../../builtin-entries";

export class MongoDbDatabaseFeed {
  constructor(private client: MongoClient) {}

  public async feed() {
    const simpleTypes = Object.keys(SimpleTypes);
    const pickSimple = (e: Entity, et: EntityType) => {
      const simpleProps = et.props.filter((p) => simpleTypes.indexOf(p.type) == -1).map((p) => p.name);
      return omit(e, simpleProps);
    };

    const db = this.client.db(SysDatabases.poseidon);
    const builtIn = builtInEntries;

    // Entity types
    const etColl = db.collection(SysEntities.entityType);
    const entityTypes = builtIn.entityTypes;
    await etColl.insertMany(entityTypes.map((e) => pickSimple(e, builtIn.entityType)));

    const propsColl = db.collection(SysEntities.entityProperty);
    const linksColl = db.collection(SysEntities.relationLink);
    const props: EntityProperty[] = [];
    const links: RelationLink[] = [];

    for (const e of entityTypes) {
      for (const p of e.props) {
        props.push(p);
        links.push(this.buildRelationLink(builtIn.propsProperty._id, e._id, p._id));

        if (p.type == PropertyTypes.relation) {
          links.push(this.buildRelationLink(builtIn.relatedEntityTypeProperty._id, p._id, p.relatedEntityType._id));
        }
      }

      links.push(
        this.buildRelationLink(builtIn.entityType.props.find((p) => p.name === SysProperties.createdBy)._id, e._id, e._createdBy._id)
      );
    }

    await propsColl.insertMany(props.map((p) => pickSimple(p, builtIn.entityTypeEntityProperty)));

    const usersColl = db.collection(SysEntities.user);
    await usersColl.insertMany([builtIn.rootUser].map((u) => pickSimple(u, builtIn.entityTypeUser)));
    await linksColl.insertMany(links);
  }

  private buildRelationLink(relationPropId: string, thisId: string, thatId: string): RelationLink {
    return {
      _createdAt: new Date(),
      relationPropId: relationPropId,
      thisId: thisId,
      thatId: thatId,
    };
  }
}
