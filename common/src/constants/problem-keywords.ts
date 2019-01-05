const ProblemKeywords = {
    minLength: "minLength",
    maxLength: "maxLength",
    maxItems: "maxItems",
    minItems: "minItems",
    additionalProperties: "additionalProperties",
    format: "format",
    minimum: "minimum",
    maximum: "maximum",
    multipleOf: "multipleOf",
    pattern: "pattern",
    required: "required",
    type: "type",
    uniqueItems: "uniqueItems",
    enum: "enum",
    missingMadatoryEntityProperty: "missingMadatoryEntityProperty",
    invalidMandatoryEntityProperty: "invalidMandatoryEntityProperty",
    invalidLinkedEntityId: "invalidLinkedEntityId",
    invalidLinkedValue: "invalidLinkedValue"
};

type ProblemKeywords = (typeof ProblemKeywords)[keyof typeof ProblemKeywords];

export { ProblemKeywords };