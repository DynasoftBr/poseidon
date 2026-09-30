/** An action invocation sent to Poseidon. */
export type PoseidonRequest = {
    /** Entity type targeted by the invocation. */
    entityType: string;
    /** Name of the operation to invoke. */
    action: string;
    /** Input supplied to the operation. */
    payload: object;
};
