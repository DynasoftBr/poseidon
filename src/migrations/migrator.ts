import { EntityType } from "@poseidon/core-models/src";

export class Migrator {
  public constructor(private readonly entityType: EntityType, private readonly unmodified: EntityType) {}

  public migrate() {
    const nameChanged = this.entityType.name != this.unmodified.name;
    if (nameChanged) {
    }
  }

  private alterTableName(oldName: string, newName: string) {}
}
