// import { IDataStorage, IRepository } from "../data";
// import { IUser, IIdentity } from "@poseidon/core-models";

// interface IIdentityNode {
//     id: string;
//     parents: IIdentityNode[];
//     children: IIdentityNode[];
// }

// export class IdentityMap {
//     private usersGroups = new Map<string, string[]>();
//     private usersIdentities = new Map<string, string[]>();

//     constructor(private readonly repo: IRepository<IIdentity>) { }

//     public async load() {
//         const identities = await this.repo.findMany({});

//         identities.forEach(identity => {
//             this.usersIdentities.set(identity._id, this.getIdentities(identity));
//         });
//     }

//     getIdentities(identity: IIdentity): string[] {
//         const identities = [identity._id];
//         const ids: string[] = identity.memberOf.map(group => this.getIdentities(group)).flat(100);

//         identities.push(...ids);
//         return identities;
//     }

//     public addIdentityToGroup(identity: IIdentity, group: IIdentity) {
//         const identities = this.usersIdentities.get(identity._id);
//         const groupIdentities = this.usersIdentities.get(group._id);

//         identities.push(...groupIdentities);
//     }

//     public addNewIdentity(identity: IIdentity) {
//         identi;
//         identities.push(...groupIdentities);
//     }

// }