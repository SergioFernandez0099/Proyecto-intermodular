import { IUser } from "./user";

export interface IRating {
    id: number,
    rating: number,
    comment: string,
    user: IUser
}
