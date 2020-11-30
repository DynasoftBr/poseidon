import { Container } from "inversify";

export enum ServiceTypes {
  DataStorage = "DataStorage",
  Logger = "Logger",
}

export const applicationContainer = new Container();
