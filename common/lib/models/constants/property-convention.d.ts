declare const PropertyConvention: {
    lowerCase: string;
    capitalizeFirstLetter: string;
    uppercase: string;
};
declare type PropertyConvention = (typeof PropertyConvention)[keyof typeof PropertyConvention];
export { PropertyConvention };
