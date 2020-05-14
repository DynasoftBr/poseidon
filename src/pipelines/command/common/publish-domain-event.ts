import { Entity, IMessage } from "@poseidon/core-models";
import { ICommandRequest } from "../command-request";
import { PipelineItem } from "../../pipeline-item";
import { IResponse } from "../../response";
import messagePublisher from "../../../messaging/message-publisher";

export interface EventSourcingEvent {
  event: string;
  entityTypeId: string;
  content: Partial<Entity>;
  date: Date;
  userId: string;
}

export async function publishDomainEvent(
  request: ICommandRequest<Entity>,
  next: PipelineItem
): Promise<IResponse> {
  if (request.response && request.response.error) return request.response;

  const message: IMessage<EventSourcingEvent> = {
    subject: "EventSourcingEvent",
    content: {
      entityTypeId: request.entityType._id,
      event: request.event,
      content: request.payload,
      date: new Date(),
      userId: request.context.user._id
    }
  } as IMessage<EventSourcingEvent>;

  messagePublisher.publish(message);
  request.response = {
    result: message.content
  };
  return next(request);
}
