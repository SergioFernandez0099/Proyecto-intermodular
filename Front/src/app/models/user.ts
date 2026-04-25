import { ILoan } from "./loan";
import { ERole } from "./role";

export interface IUser {
    id: number,
    name: string,
    lastname: string,
    email: string,
    role: ERole,
    active?: boolean,
    loans?: ILoan[]
}