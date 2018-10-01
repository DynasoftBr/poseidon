const TestProperties = {
    _id: "_id",
    stringProp: "stringProp",
    intProp: "intProp",
    numberProp: "numberProp",
    dateTimeProp: "dateTimeProp",
    booleanProp: "booleanProp",
    arrayOfSimpleTypeProp: "arrayOfSimpleTypeProp",
    arrayOfAbstractEntityProp: "arrayOfAbstractEntityProp",
    arrayOfLinkedEntityProp: "arrayOfLinkedEntityProp",
    abstractEntityProp: "abstractEntityProp",
    linkedEntityProp: "linkedEntityProp"
};

type TestProperties = (typeof TestProperties)[keyof typeof TestProperties];

export { TestProperties };
