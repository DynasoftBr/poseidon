const PropertyType = {
    string: "string",
    int: "integer",
    number: "number",
    dateTime: "dateTime",
    boolean: "boolean",
    abstractEntity: "abstractEntity",
    linkedEntity: "linkedEntity",
    array: "array",
    enum: "enum",
    "any": "any"
};

type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];

export { PropertyType };

