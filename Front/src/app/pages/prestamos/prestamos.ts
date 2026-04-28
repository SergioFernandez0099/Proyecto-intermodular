import { Component, computed, inject, signal } from '@angular/core';
import { Menu } from '../../components/menu/menu';
import { IBook } from '../../models/book';
import { ILoan } from '../../models/loan';
import { LoanService } from '../../services/loan';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { IUser } from '../../models/user';
import { AuthService } from '../../core/services/auth.service';
import { TranslatePipe } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-prestamos',
  standalone: true,
  imports: [Menu, TranslatePipe, DatePipe],
  templateUrl: './prestamos.html',
  styleUrl: './prestamos.css',
})
export class Prestamos {
  private loanService = inject(LoanService);
  private authService = inject(AuthService);
  public user = signal<IUser>({} as IUser);
  public myLoans = signal<ILoan[]>([]);
  public savedLanguage: string = "";
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  currentPage = signal(0);
  itemsPerPage = 3;
  totalPages = computed(() => {
    const length = this.myLoans().length;
    return Math.max(1, Math.ceil(length / this.itemsPerPage));
  });
  paginatedLoans = computed(() => {
    const start = this.currentPage() * this.itemsPerPage;
    return this.myLoans().slice(start, start + this.itemsPerPage);
  });


  ngOnInit(): void {
    this.loadData();
    this.savedLanguage = localStorage.getItem('language') || 'es';
  }
  
  async loadData() {
    this.isLoading.set(true);
    try {
      const [myLoans, user] = await Promise.all([
        firstValueFrom(this.loanService.getLoans()),
        firstValueFrom(this.authService.me()),
      ]);
      this.myLoans.set(myLoans);
      this.user.set(user.data);

    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(value => value - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() + 1 < this.totalPages()) {
      this.currentPage.update(value => value + 1);
    }
  }

  getBookAuthors(book: Partial<IBook> | undefined): string {
    return book?.authors?.map(author => author.name).join(', ') || 'N/A';
  }

  returnBook(loan: ILoan) {
    this.loanService.returnLoan(loan).subscribe(value => {
      loan = value;
    });
    loan.return_date = new Date() + ""
  }

}
