import { Component, computed, inject, signal } from '@angular/core';
import { Menu } from '../../components/menu/menu';
import { IBook } from '../../models/book';
import { ILoan } from '../../models/loan';
import { LoanService } from '../../services/loan';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { IUser } from '../../models/user';
import { AuthService } from '../../core/services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SERVER_BASE } from '../../core/constants/api';

@Component({
  selector: 'app-prestamos',
  standalone: true,
  imports: [Menu, TranslateModule, DatePipe],
  templateUrl: './prestamos.html',
  styleUrl: './prestamos.css',
})
export class Prestamos {
  private loanService = inject(LoanService);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);
  public user = signal<IUser>({} as IUser);
  public myLoans = signal<ILoan[]>([]);
  public savedLanguage: string = "";
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  currentPage = signal(0);
  itemsPerPage = 3;
  showColumnModal = signal(false);

  readonly columns = [
    { key: 'cover', labelKey: 'Prestamos.tabla.portada' },
    { key: 'book', labelKey: 'Prestamos.tabla.libro' },
    { key: 'loanDate', labelKey: 'Prestamos.tabla.pedido' },
    { key: 'returnDate', labelKey: 'Prestamos.tabla.devuelto' },
    { key: 'actions', labelKey: 'Prestamos.tabla.acciones' }
  ] as const;

  visibleColumns = signal<Record<string, boolean>>({
    cover: true,
    book: true,
    loanDate: true,
    returnDate: true,
    actions: true
  });
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
    const appLanguage = localStorage.getItem('language') || 'es';
    this.savedLanguage = this.mapDateLocale(appLanguage);
  }

  private mapDateLocale(language: string): string {
    if (language === 'pr') {
      return 'pt';
    }

    if (language === 'fr' || language === 'en' || language === 'es') {
      return language;
    }

    return 'es';
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

  openColumnModal(): void {
    this.showColumnModal.set(true);
  }

  closeColumnModal(): void {
    this.showColumnModal.set(false);
  }

  isColumnVisible(columnKey: string): boolean {
    return !!this.visibleColumns()[columnKey];
  }

  toggleColumn(columnKey: string): void {
    const columns = this.visibleColumns();
    const enabledCount = Object.values(columns).filter(Boolean).length;

    if (columns[columnKey] && enabledCount === 1) {
      return;
    }

    this.visibleColumns.update(current => ({
      ...current,
      [columnKey]: !current[columnKey]
    }));
  }

  getBookAuthors(book: Partial<IBook> | undefined): string {
    return book?.authors?.map(author => author.name).join(', ') || this.translate.instant('Prestamos.no_disponible');
  }

  getCoverUrl(coverImage: string | null | undefined): string {
    if (!coverImage) {
      return 'assets/img/bookSwap.png';
    }

    if (/^https?:\/\//i.test(coverImage)) {
      return coverImage;
    }

    const normalizedPath = coverImage.startsWith('/') ? coverImage : `/${coverImage}`;
    return `${SERVER_BASE}${normalizedPath}`;
  }

  returnBook(loan: ILoan) {
    this.loanService.returnLoan(loan).subscribe(value => {
      loan = value;
    });
    loan.return_date = new Date() + ""
  }

}
