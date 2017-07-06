const PropertyType = {
    String: "String",
    Int: "Integer",
    Number: "Number",
    Date: "Date",
    Boolean: "Boolean",
    AbstractEntity: "AbstractEntity",
    LinkedEntity: "LinkedEntity",
    Array: "Array",
    Enum: "Enum"
};

type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];

export { PropertyType };

