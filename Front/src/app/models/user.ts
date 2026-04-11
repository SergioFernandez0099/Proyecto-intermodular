import { ERole } from "./role";

export interface IUser {
    id: number,
    name: string,
    lastname?: string,
    email?: string,
    role?: ERole,
    active?: boolean,
    loans?: any //TODO: ajustar cuando esté el modelo
}