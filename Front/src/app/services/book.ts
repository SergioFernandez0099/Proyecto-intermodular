import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IBook } from '../models/book';

// Para listas de libros (index, mine)
export interface BooksResponse {
  data: IBook[];
}

// Para un solo libro 
export interface SingleBookResponse {
  data: IBook;
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private apiUrl = 'http://localhost:8000/api/books'; 
  private apiUrlMy = 'http://localhost:8000/api/books/mine'; 

  constructor(private http: HttpClient) {}

  // MÉTODOS QUE DEVUELVEN ARRAYS (IBook[]) 

  getBooks(): Observable<IBook[]> {
    return this.http.get<BooksResponse>(this.apiUrl).pipe(
      map(response => response.data) 
    );
  }

  // --- MÉTODOS QUE DEVUELVEN UN SOLO OBJETO (IBook) ---

  getBook(id: number): Observable<IBook> {
    return this.http.get<SingleBookResponse>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  createBook(data: IBook | FormData): Observable<IBook> {
    return this.http.post<SingleBookResponse>(this.apiUrl, data).pipe(
      map(response => response.data)
    );
  }

  updateBook(book: IBook, id: number): Observable<IBook> {
    return this.http.put<SingleBookResponse>(`${this.apiUrl}/${id}`, book).pipe(
      map(response => response.data)
    );
  }

  deleteBook(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  updateCover(file: File, id: number): Observable<IBook> {
    const formData = new FormData();
    formData.append('cover_image', file);
    
    return this.http.post<SingleBookResponse>(`${this.apiUrl}/${id}/cover`, formData).pipe(
      map(response => response.data)
    );
  }

  deleteCover(id: number): Observable<IBook> {
    return this.http.delete<SingleBookResponse>(`${this.apiUrl}/${id}/cover`).pipe(
      map(response => response.data)
    );
  }
}