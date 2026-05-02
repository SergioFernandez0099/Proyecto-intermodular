import { Component, computed, inject, signal } from '@angular/core';
import { Menu } from '../../components/menu/menu';
import { BookService } from '../../services/book';
import { IBook } from '../../models/book';
import { ILoan } from '../../models/loan';
import { LoanService } from '../../services/loan';
import { firstValueFrom } from 'rxjs';
import { IUser } from '../../models/user';
import { AuthService } from '../../core/services/auth.service';
import { TranslatePipe } from '@ngx-translate/core';
import { CopyService, CopyStatus } from '../../services/copy';
import { ICopy } from '../../models/copy';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [Menu, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private loanService = inject(LoanService);
  private authService = inject(AuthService);
  private copyService = inject(CopyService);
  public user = signal<IUser>({} as IUser);
  public myCopies = signal<ICopy[]>([]);
  public loansInvolvingMe = signal<ILoan[]>([]);
  public myLoans = signal<ILoan[]>([]);
  public loanedBooks = signal<ILoan[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  currentPage = signal(0);
  itemsPerPage = 3;
  totalPages = computed(() => {
    const length = this.loansInvolvingMe().length;
    return Math.max(1, Math.ceil(length / this.itemsPerPage));
  });
  paginatedLoans = computed(() => {
    const start = this.currentPage() * this.itemsPerPage;
    return this.loansInvolvingMe().slice(start, start + this.itemsPerPage);
  });


  ngOnInit(): void {
    this.loadData();
  }
  
  async loadData() {
    this.isLoading.set(true);
    try {
      const [myCopies, loansInvolvingMe, user] = await Promise.all([
        firstValueFrom(this.copyService.getMyCopies()),
        firstValueFrom(this.loanService.getLoans()),
        firstValueFrom(this.authService.me()),
      ]);
      this.user.set(user.data);
      const myId = user.data.id;
      
      this.myCopies.set(myCopies);
      this.loansInvolvingMe.set(loansInvolvingMe.filter(loan => !loan.return_date));

      const myLoans = this.loansInvolvingMe().filter(loan => loan.user?.id === myId);
      this.myLoans.set(myLoans);

      const loanedBooks = this.loansInvolvingMe().filter(loan => loan.copy?.owner === myId);
      this.loanedBooks.set(loanedBooks);

      const sortedLoans = [...myLoans, ...loanedBooks].sort((a, b) => this.diasDesde(b.loan_date) - this.diasDesde(a.loan_date))
      this.loansInvolvingMe.set(sortedLoans);

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

  diasDesde(loanDate: string): number {
    const date = new Date(loanDate);
    const now = new Date();

    const diffInMs = Math.abs(now.getTime() - date.getTime());

    const oneDayInMs = 24 * 60 * 60 * 1000;
    const days = Math.floor(diffInMs / oneDayInMs);

    return days;
  }

}
