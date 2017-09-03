const PropertyConvention = {
    lowerCase: "lowercase",
    capitalizeFirstLetter: "Capitalize First Letter",
    uppercase: "UPPERCASE"
};

type PropertyConvention = (typeof PropertyConvention)[keyof typeof PropertyConvention];

export { PropertyConvention };