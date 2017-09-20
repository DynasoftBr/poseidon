export interface ResObj {
    status: "success" | "error";
    itens?: number;
    result?: any;
    error?: object;
    warnings?: any;
}