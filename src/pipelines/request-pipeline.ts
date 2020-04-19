import { PipelineItem } from "./pipeline-item";
import { IRequest } from "./request";
import { IResponse } from "./response";

export class RequestPipeline<T extends any = any, TResponse extends any = any> {
  private pipeline: PipelineItem<T, TResponse>;
  constructor(private readonly request: IRequest, handlers: PipelineItem<T, TResponse>[]) {
    if (!handlers || handlers.length === 0) {
      throw new Error("The 'handlers' param must be an not null array with at least one element.");
    }

    const items: PipelineItem[] = [
      async (request: IRequest) => {
        return request.response;
      },
      ...handlers.reverse()
    ];

    this.pipeline = items.reduce((h, i) => req => i(req, h));
  }

  public async handle(): Promise<IResponse<TResponse>> {
    return await this.pipeline(this.request);
  }
}
