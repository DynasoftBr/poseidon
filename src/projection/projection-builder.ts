import { IRepositoryFactory, IRepository } from "../data";
import messageReceiver from "../messaging/message-receiver";
import { EventSourcingEvent } from "../pipelines/command/common/publish-domain-event";
import { IEntityType } from "@poseidon/core-models/src";

export class ProjectionBuilder {
  constructor(private repoFactory: IRepositoryFactory) {
    messageReceiver.subscribe<EventSourcingEvent>("EventSourcingEvent", message => {
      this.saveProjection(message.content);
    });
  }

  private async saveProjection(event: EventSourcingEvent) {
    const entityType = await (await this.repoFactory.entityType()).findById(event.entityTypeId);
    const repo = await this.repoFactory.createById(event.entityTypeId);
    const entity = await repo.findById(event.content._id);

    const result = Object.assign({}, entity, event.content, {
      _createdAt: event.date,
      _createdBy: {
        _id: event.userId
      }
    });

    await repo.upsert(result);
  }

  private setCreatedInfo(event: EventSourcingEvent): this {
    // event.content._changedBy = {
    //   _id: event.userId
    // };
    return this;
  }
}