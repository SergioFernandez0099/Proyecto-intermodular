import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ICopy } from '../models/copy';
import { API_BASE } from '../core/constants/api';


export interface CopiesResponse {
  data: ICopy[];
}

export interface SingleCopyResponse {
  data: ICopy;
}

export interface CopyStatusResponse {
  data: CopyStatus[];
}

export interface CopyStatus {
  id: number,
  code: string,
  state: string,
  active_loan: any
}

@Injectable({
  providedIn: 'root'
})
export class CopyService {
  private apiUrl = `${API_BASE}/books`; 
  constructor(private http: HttpClient) {}

  getMyCopies(): Observable<ICopy[]> {
    return this.http.get<CopiesResponse>(`${this.apiUrl}/mine`).pipe(
      map(response => response.data)
    );
  }

  getCopies(bookId: number): Observable<ICopy[]> {
    return this.http.get<CopiesResponse>(`${this.apiUrl}/${bookId}/copies`).pipe(
      map(response => response.data)
    );
  }

  createCopy(bookId: number): Observable<ICopy> {
    return this.http.post<SingleCopyResponse>(`${this.apiUrl}/${bookId}/copies`, {}).pipe(
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



  getCopiesStatus(bookId: number): Observable<CopyStatus[]> {
    return this.http.get<CopyStatusResponse>(`${this.apiUrl}/${bookId}/copies/status`).pipe(
      map(response => response.data)
    );
  }
}