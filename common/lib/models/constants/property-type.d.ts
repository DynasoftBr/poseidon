declare const PropertyType: {
    string: string;
    int: string;
    number: string;
    dateTime: string;
    boolean: string;
    abstractEntity: string;
    linkedEntity: string;
    array: string;
    enum: string;
    javascript: string;
};
declare type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];
export { PropertyType };
