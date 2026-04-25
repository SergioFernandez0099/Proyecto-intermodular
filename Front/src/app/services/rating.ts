import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface Rating {
  rating: number;
  comment?: string;
}


@Injectable({
  providedIn: 'root'
})
export class RatingService {
  private apiUrl = 'http://localhost:8000/api/books';
  constructor(private http: HttpClient) {}

  createRating(bookId: number, rating: Rating): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${bookId}/ratings`, rating).pipe(
      map(response => response.data)
    );
  }

  updateRating(bookId: number, rating: Rating, ratingId: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${bookId}/ratings/${ratingId}`, rating).pipe(
      map(response => response.data)
    );
  }

  deleteRating(bookId: number, ratingId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${bookId}/ratings/${ratingId}`).pipe(
      map(response => response.data)
    );
  }

}