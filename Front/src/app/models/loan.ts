import { ICopy } from "./copy";
import { IUser } from "./user";

export interface ILoan {
    id: number,
    loan_date: Date,
    return_date: Date,
    copy?: ICopy,
    user: IUser
}