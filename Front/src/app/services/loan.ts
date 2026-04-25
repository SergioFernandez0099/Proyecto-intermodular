import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ILoan } from '../models/loan';

export interface LoansResponse {
  data: ILoan[];
}

export interface LoanResponse {
  data: ILoan;
}

@Injectable({
  providedIn: 'root'
})

export class LoanService {
  private apiUrl = 'http://localhost:8000/api/loans'; 

  constructor(private http: HttpClient) {}

  getLoans(): Observable<ILoan[]> {
    return this.http.get<LoansResponse>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  getLoan(id: number): Observable<ILoan> {
    return this.http.get<LoanResponse>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }


  createLoan(bookId: number): Observable<ILoan> {
    return this.http.post<LoanResponse>(this.apiUrl, { book_id: bookId }).pipe(
      map(response => response.data)
    );
  }

  returnLoan(loan: ILoan, id: number): Observable<ILoan> {
    return this.http.put<LoanResponse>(`${this.apiUrl}/${id}/return`, loan).pipe(
      map(response => response.data)
    );
  }
}