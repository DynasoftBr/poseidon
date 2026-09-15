import type { Entity } from '../entity';

export interface SystemUser extends Entity, SystemUserData {}

export type SystemUserData = {
    name: string;
    login: string;
};
