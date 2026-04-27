import { Component, computed, inject, signal } from '@angular/core';
import { Menu } from '../../components/menu/menu';
import { BookService } from '../../services/book';
import { IBook } from '../../models/book';
import { ILoan } from '../../models/loan';
import { LoanService } from '../../services/loan';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { IUser } from '../../models/user';
import { AuthService } from '../../core/services/auth.service';
import { TranslatePipe } from '@ngx-translate/core';
import { CopyService, CopyStatus } from '../../services/copy';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [Menu, TranslatePipe, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private bookService = inject(BookService);
  private loanService = inject(LoanService);
  private authService = inject(AuthService);
  private copyService = inject(CopyService);
  public user = signal<IUser>({} as IUser);
  public myBooks = signal<IBook[]>([]);
  public myBooksStatus = signal<CopyStatus[]>([]);
  public myLoans = signal<ILoan[]>([]);
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
  }
  
  async loadData() {
    this.isLoading.set(true);
    try {
      const [myBooks, myLoans, user] = await Promise.all([
        firstValueFrom(this.bookService.getMyBooks()),
        firstValueFrom(this.loanService.getLoans()),
        firstValueFrom(this.authService.me()),
      ]);
      this.myBooks.set(myBooks);
      this.myLoans.set(myLoans);
      this.user.set(user.data);
      this.getMyBooksStatus(myBooks);

    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getMyBooksStatus(myBooks: IBook[]) {
    myBooks.map(book => {
      firstValueFrom(this.copyService.getCopiesStatus(book.id))
        .then((copies: CopyStatus[]) => {
          this.myBooksStatus.update(current => ([...current, ...copies]));
        })
    });
  }

  countCurrentlyLoaned(): number {
    return this.myBooksStatus().filter(copy => copy.state === "borrowed").length;
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

}
