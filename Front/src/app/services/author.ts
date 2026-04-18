import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IAuthor } from '../models/author';


export interface AuthorsResponse {
  data: IAuthor[];
}

export interface AuthorResponse {
  data: IAuthor;
}

@Injectable({
  providedIn: 'root'
})
export class AuthorService {
  private apiUrl = 'http://localhost:8000/api/authors';  
  constructor(private http: HttpClient) {}

  getAuthors(): Observable<IAuthor[]> {
    return this.http.get<AuthorsResponse>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  getAuthor(id: number): Observable<IAuthor> {
    return this.http.get<AuthorResponse>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  createAuthor(author: IAuthor): Observable<IAuthor> {
    return this.http.post<AuthorResponse>(this.apiUrl, author).pipe(
      map(response => response.data)
    );
  }

  updateAuthor(author: IAuthor, id: number): Observable<IAuthor> {
    return this.http.put<AuthorResponse>(`${this.apiUrl}/${id}`, author).pipe(
      map(response => response.data)
    );
  }

  deleteAuthor(id: number): Observable<IAuthor> {
    return this.http.delete<AuthorResponse>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }
}