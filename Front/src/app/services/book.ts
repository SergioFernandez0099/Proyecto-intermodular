import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IBook } from '../models/book';


export interface BooksResponse {
  data: IBook[];
}

export interface BookResponse {
  data: IBook;
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private apiUrl = 'http://localhost:8000/api/books'; 
  private apiUrlMy = 'http://localhost:8000/api/books/mine'; 
  constructor(private http: HttpClient) {}

  getBooks(): Observable<IBook[]> {
    return this.http.get<BooksResponse>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  getMyBooks(): Observable<IBook[]> {
    return this.http.get<BooksResponse>(this.apiUrlMy).pipe(
      map(response => response.data)
    );
  }

  getBook(id: number): Observable<IBook> {
    return this.http.get<BookResponse>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  createBook(data: IBook | FormData): Observable<IBook> {
    return this.http.post<BookResponse>(this.apiUrl, data).pipe(
      map(response => response.data)
    );
  }

  updateBook(book: IBook, id: number): Observable<IBook> {
    return this.http.put<BookResponse>(`${this.apiUrl}/${id}`, book).pipe(
      map(response => response.data)
    );
  }

  deleteBook(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  updateCover(file: File, id: number): Observable<IBook> {
    const input = {cover_image: file};
    return this.http.post<BookResponse>(`${this.apiUrl}/${id}/cover`, input).pipe(
      map(response => response.data)
    );
  }

  deleteCover(id: number): Observable<IBook> {
    return this.http.delete<BookResponse>(`${this.apiUrl}/${id}/cover`).pipe(
      map(response => response.data)
    );
  }

  importBooks(file: File): Observable<any> {
    const input = {cover_image: file};
    return this.http.post<any>(`${this.apiUrl}`, input).pipe(
      map(response => response.data)
    );
  }
}