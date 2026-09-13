import type { Entity } from './entity';

export interface SystemUser extends Entity {
    name: string;
    login: string;
}
