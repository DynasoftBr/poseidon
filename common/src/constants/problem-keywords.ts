const ProblemKeywords = {
    minLength: "minLength",
    maxLength: "maxLength",
    maxItems: "maxItems",
    additionalProperties: "additionalProperties",
    format: "format",
    minimum: "minimum",
    maximum: "maximum",
    multipleOf: "multipleOf",
    pattern: "pattern",
    required: "required",
    type: "type",
    uniqueItems: "uniqueItems",
    enum: "enum"
};

type ProblemKeywords = (typeof ProblemKeywords)[keyof typeof ProblemKeywords];

export { ProblemKeywords };