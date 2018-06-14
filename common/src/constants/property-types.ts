const PropertyTypes = {
    string: "string",
    int: "integer",
    number: "number",
    dateTime: "dateTime",
    boolean: "boolean",
    abstractEntity: "abstractEntity",
    linkedEntity: "linkedEntity",
    array: "array",
    enum: "enum",
    javascript: "javascript"
};

type PropertyTypes = (typeof PropertyTypes)[keyof typeof PropertyTypes];

export { PropertyTypes };

