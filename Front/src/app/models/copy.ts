import { IBook } from "./book";
import { EState } from "./state";

export interface ICopy {
    id: number,
    code: any,
    state?: EState,
    book_id: IBook
}