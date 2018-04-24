import { Router, Request, Response, Express } from "express";

export function customLogger(req: Request, res: Response, next: () => void) {
    next();
}

export function mqueryParser(req: Request, res: Response, next: () => void) {
    next();
}