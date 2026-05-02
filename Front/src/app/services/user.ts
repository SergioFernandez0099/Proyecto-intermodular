import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUser } from '../models/user';
import { map } from 'rxjs/operators';
import { API_BASE } from '../core/constants/api';


interface UsersResponse {
  data: IUser[];
}

interface SingleUserResponse {
  data: IUser;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${API_BASE}/users`;
  constructor(private http: HttpClient) {}

  getUsers(): Observable<IUser[]> {
    return this.http.get<UsersResponse>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  getUserById(id: number): Observable<IUser> {
    return this.http.get<SingleUserResponse>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  updateUser(user: IUser, id: number): Observable<IUser> {
    return this.http.put<SingleUserResponse>(`${this.apiUrl}/${id}`, user).pipe(
      map(response => response.data)
    );
  }

  activateUser(id: number): Observable<IUser> {
    return this.http.patch<SingleUserResponse>(`${this.apiUrl}/${id}/activate`, {}).pipe(
      map(response => response.data)
    );
  }

  deactivateUser(id: number): Observable<IUser> {
    return this.http.patch<SingleUserResponse>(`${this.apiUrl}/${id}/deactivate`, {}).pipe(
      map(response => response.data)
    );
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }


}