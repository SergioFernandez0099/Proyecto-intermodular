import { IAuthor } from "./author";
import { IGenre } from "./genre";
import { IRating } from "./rating";

export interface IBook {
    id: number,
    title: string,
    cover_image: string | null,
    publication_year: number | null,
    genre?: Partial<IGenre>,
    authors?: Partial<IAuthor>[],
    available?: boolean,
    ratings_count?: number,
    average_rating?: number,
    ratings?: IRating[],
}