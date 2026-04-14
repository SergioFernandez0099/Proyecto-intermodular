import { IBook } from "./book";
import { EState } from "./state";

export interface ICopy {
    id: number,
    code: string,
    state: EState,
    book?: Partial<IBook>
}