import { Router, Request, Response } from "express";
import { ApiV1 } from "./v1/api-v1";

function normalizeParamsToLower(req: Request, res: Response, next: () => void) {
    let json = JSON.stringify(req.body);
    let obj = JSON.parse(json.replace(/"([^"]+)":/g, function ($0, $1) { return ('"' + $1.toLowerCase() + '":'); }));

    req.body = obj;
    next();
}

export function ApiRouter() {
    const router = Router();
    router.use(normalizeParamsToLower);
    router.use(new ApiV1().router);
    return router;
}