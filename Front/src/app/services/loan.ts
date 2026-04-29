import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ILoan } from '../models/loan';

export interface LoansResponse {
  data: ILoan[];
}

export interface SingleLoanResponse {
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
    return this.http.get<SingleLoanResponse>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }


  createLoan(bookId: number): Observable<ILoan> {
    return this.http.post<SingleLoanResponse>(this.apiUrl, { book_id: bookId }).pipe(
      map(response => response.data)
    );
  }

  returnLoan(loan: ILoan): Observable<ILoan> {
    return this.http.patch<SingleLoanResponse>(`${this.apiUrl}/${loan.id}/return`, loan).pipe(
      map(response => response.data)
    );
  }
}