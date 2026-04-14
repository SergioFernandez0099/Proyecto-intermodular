import { IUser } from "./user";

export interface IRating {
    id: number,
    rating: number,
    comment: string,
    edited?: boolean,
    created_at?: string,
    user?: Partial<IUser>
}
