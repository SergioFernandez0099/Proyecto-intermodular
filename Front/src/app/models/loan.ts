import { ICopy } from "./copy";
import { IUser } from "./user";

export interface ILoan {
    id: number,
    loan_date: string,
    return_date: string | null,
    copy?: Partial<ICopy>,
    user?: Partial<IUser>,
    updated_at?: string
}