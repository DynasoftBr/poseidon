/**
 * An action invocation sent to Poseidon.
 */
export type PoseidonRequest = {
    entityType: string;
    action: string;
    payload: object;
};
