import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IGenre } from '../models/genre';


export interface GenresResponse {
  data: IGenre[];
}

export interface GenreResponse {
  data: IGenre;
}

@Injectable({
  providedIn: 'root'
})
export class GenreService {
  private apiUrl = 'http://localhost:8000/api/genres';  
  constructor(private http: HttpClient) {}

  getGenres(): Observable<IGenre[]> {
    return this.http.get<GenresResponse>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  getGenre(id: number): Observable<IGenre> {
    return this.http.get<GenreResponse>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  createGenre(genre: IGenre): Observable<IGenre> {
    return this.http.post<GenreResponse>(this.apiUrl, genre).pipe(
      map(response => response.data)
    );
  }

  updateGenre(genre: IGenre, id: number): Observable<IGenre> {
    return this.http.put<GenreResponse>(`${this.apiUrl}/${id}`, genre).pipe(
      map(response => response.data)
    );
  }

  deleteGenre(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }
}