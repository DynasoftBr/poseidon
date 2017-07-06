import { ValidateMsg } from "./";

export interface ValidationResult {
    status: "success" | "error";
    erros?: ValidateMsg[];
}