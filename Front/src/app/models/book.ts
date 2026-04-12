import { IAuthor } from "./author";
import { IGenre } from "./genre";
import { IRating } from "./rating";

export interface IBook {
    id: number,
    title: string,
    cover_image?: string,
    publication_year?: number,
    genre?: IGenre,
    authors?: IAuthor[],
    available?: boolean,
    ratings_count?: number,
    average_rating?: number,
    ratings?: IRating[],
}