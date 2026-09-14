import type { Entity } from '../entity';

export type SystemUser = Entity<SystemUserData>;

export type SystemUserData = {
    name: string;
    login: string;
};
