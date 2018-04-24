const SimpleTypes = {
    string: "string",
    int: "integer",
    number: "number",
    dateTime: "dateTime",
    boolean: "boolean",
    enum: "enum"
};

type SimpleTypes = (typeof SimpleTypes)[keyof typeof SimpleTypes];

export { SimpleTypes };
