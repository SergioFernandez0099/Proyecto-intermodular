import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IAuthor } from '../models/author';
import { API_BASE } from '../core/constants/api';


export interface AuthorsResponse {
  data: IAuthor[];
}

export interface SingleAuthorResponse {
  data: IAuthor;
}

@Injectable({
  providedIn: 'root'
})
export class AuthorService {
  private apiUrl = `${API_BASE}/authors`;  
  constructor(private http: HttpClient) {}

  getAuthors(): Observable<IAuthor[]> {
    return this.http.get<AuthorsResponse>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  getAuthor(id: number): Observable<IAuthor> {
    return this.http.get<SingleAuthorResponse>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  createAuthor(author: IAuthor): Observable<IAuthor> {
    return this.http.post<SingleAuthorResponse>(this.apiUrl, author).pipe(
      map(response => response.data)
    );
  }

  updateAuthor(author: IAuthor, id: number): Observable<IAuthor> {
    return this.http.put<SingleAuthorResponse>(`${this.apiUrl}/${id}`, author).pipe(
      map(response => response.data)
    );
  }

  deleteAuthor(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }
}