import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ICopy } from '../models/copy';


export interface CopiesResponse {
  data: ICopy[];
}

export interface SingleCopyResponse {
  data: ICopy;
}

@Injectable({
  providedIn: 'root'
})
export class CopyService {
  private apiUrl = 'http://localhost:8000/api/books';
  constructor(private http: HttpClient) {}

  getCopies(bookId: number): Observable<ICopy[]> {
    return this.http.get<CopiesResponse>(`${this.apiUrl}/${bookId}/copies`).pipe(
      map(response => response.data)
    );
  }

  createCopy(copy: ICopy): Observable<ICopy> {
    return this.http.post<SingleCopyResponse>(`${this.apiUrl}/${copy.book?.id}/copies`, copy).pipe(
      map(response => response.data)
    );
  }

  updateCopy(copy: ICopy, state: 'available' | 'borrowed'): Observable<ICopy> {
    return this.http.patch<SingleCopyResponse>(`${this.apiUrl}/${copy.book?.id}/copies/${copy.id}`, {state: state}).pipe(
      map(response => response.data)
    );
  }

  deleteCopy(copy: ICopy): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${copy.book?.id}/copies/${copy.id}`).pipe(
      map(response => response.data)
    );
  }
}