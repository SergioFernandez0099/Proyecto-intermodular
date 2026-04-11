import { IBook } from "./book"

export interface IAuthor {
    id: number,
    name: string,
    books?: IBook[]
}
