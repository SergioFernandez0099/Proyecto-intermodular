import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUser } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8000/api/users';
  private apiLogin = 'http://localhost:8000/login';
  constructor(private http: HttpClient) {}

  //para el login
  loginUser(credentials: any): Observable<any> {
    return this.http.post(this.apiLogin, credentials);
  }
  
  getUsers(): Observable<IUser[]> {
    return this.http.get<IUser[]>(this.apiUrl);
  }

  
  getUserById(id: number | string): Observable<IUser> {
    return this.http.get<IUser>(`${this.apiUrl}/${id}`);
  }

  createUser(userData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, userData);
  }

  
  updateUser(id: number | string, userData: IUser): Observable<IUser> {
    return this.http.put<IUser>(`${this.apiUrl}/${id}`, userData);
  }

  deleteUser(id: number | string): Observable<IUser> {
    return this.http.delete<IUser>(`${this.apiUrl}/${id}`);
  }
}