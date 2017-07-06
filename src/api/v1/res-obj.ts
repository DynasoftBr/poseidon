function strEnum<T extends string>(o: Array<T>): {[K in T]: K} {
    return o.reduce((res, key) => {
        res[key] = key;
        return res;
    }, Object.create(null));
}

export const ResObjStatus = strEnum(["success", "error"]);

export type ResObjStatus = keyof typeof ResObjStatus;

export interface ResObj {
    status: ResObjStatus;
    itens?: number;
    result?: any;
    error?: object;
    warnings?: any;
}

let sample: ResObjStatus;
sample = ResObjStatus.error;