import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Book {
  id: number;
  title: string;
  cover_image: string;
  publication_year: number;
  genre: string;
  authors_list: string[];
  status?: string; 
}

export interface BookResponse {
  data: Book[];
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private apiUrl = 'http://localhost:8000/api/books'; 
  constructor(private http: HttpClient) {}

  getBooks(): Observable<Book[]> {
    return this.http.get<BookResponse>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }
}