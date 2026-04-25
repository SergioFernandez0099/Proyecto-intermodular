import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUser } from '../models/user';
import { map } from 'rxjs/operators';


interface UsersResponse {
  data: IUser[];
}

interface UserResponse {
  data: IUser;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8000/api/users';
  constructor(private http: HttpClient) {}

  getUsers(): Observable<IUser[]> {
    return this.http.get<UsersResponse>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  getUserById(id: number): Observable<IUser> {
    return this.http.get<UserResponse>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  updateUser(user: IUser, id: number): Observable<IUser> {
    return this.http.put<UserResponse>(`${this.apiUrl}/${id}`, user).pipe(
      map(response => response.data)
    );
  }

  activateUser(id: number): Observable<IUser> {
    return this.http.patch<UserResponse>(`${this.apiUrl}/${id}/activate`, {}).pipe(
      map(response => response.data)
    );
  }

  deactivateUser(id: number): Observable<IUser> {
    return this.http.patch<UserResponse>(`${this.apiUrl}/${id}/deactivate`, {}).pipe(
      map(response => response.data)
    );
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }


}