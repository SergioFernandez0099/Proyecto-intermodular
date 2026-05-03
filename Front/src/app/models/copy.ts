import { IBook } from "./book";
import { EState } from "./state";
import { IUser } from "./user";

export interface ICopy {
    id: number,
    code: string,
    state: EState,
    book?: Partial<IBook>,
    owner?: Partial<IUser>
}