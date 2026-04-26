import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Menu } from '../../components/menu/menu';
import { BookService } from '../../services/book';
import { IBook } from '../../models/book';

@Component({
  selector: 'app-mis-libros',
  standalone: true,
  imports: [Menu, CommonModule, TranslateModule],
  templateUrl: './mis-libros.html',
  styleUrl: './mis-libros.css',
})
export class MisLibros implements OnInit {
  books = signal<IBook[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  activeTab = signal<'all' | 'available' | 'borrowed'>('all');
  filterText = signal('');
  currentPage = signal(0);
  itemsPerPage = 3;

  filteredBooks = computed(() => {
    const search = this.filterText().toLowerCase().trim();
    return this.books()
      .filter(book => {
        const availableCopies = book.available_copies_count ?? 0;
        const totalCopies = book.copies_count ?? availableCopies;
        const borrowedCopies = Math.max(0, totalCopies - availableCopies);

        if (this.activeTab() === 'available') {
          return availableCopies > 0;
        }

        if (this.activeTab() === 'borrowed') {
          return borrowedCopies > 0;
        }

        return true;
      })
      .filter(book => {
        if (!search) return true;
        const title = book.title.toLowerCase();
        const authors = book.authors?.map(author => author.name?.toLowerCase() ?? '').join(' ') ?? '';
        return title.includes(search) || authors.includes(search);
      });
  });

  totalPages = computed(() => {
    const length = this.filteredBooks().length;
    return Math.max(1, Math.ceil(length / this.itemsPerPage));
  });

  paginatedBooks = computed(() => {
    const start = this.currentPage() * this.itemsPerPage;
    return this.filteredBooks().slice(start, start + this.itemsPerPage);
  });

  totalCount = computed(() => this.books().length);
  availableCount = computed(() => this.books().filter(book => (book.available_copies_count ?? 0) > 0).length);
  borrowedCount = computed(() =>
    this.books().filter(book => {
      const availableCopies = book.available_copies_count ?? 0;
      const totalCopies = book.copies_count ?? availableCopies;
      return totalCopies - availableCopies > 0;
    }).length
  );

  constructor(
    private router: Router,
    private bookService: BookService
  ) {}

  ngOnInit(): void {
    this.loadMyBooks();
  }

  private loadMyBooks(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.bookService.getMyBooks().subscribe({
      next: books => {
        this.books.set(books);
        this.isLoading.set(false);
      },
      error: error => {
        console.error('Error al cargar Mis Libros:', error);
        this.errorMessage.set('No se pudieron cargar tus libros. Intenta de nuevo más tarde.');
        this.isLoading.set(false);
      }
    });
  }

  setTab(tab: 'all' | 'available' | 'borrowed'): void {
    this.activeTab.set(tab);
    this.currentPage.set(0);
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.filterText.set(target.value);
    this.currentPage.set(0);
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

  goAddBook(): void {
    this.router.navigate(['/añadirLibro']);
  }

  goAddCopy(book: IBook): void {
    this.router.navigate(['/añadirLibro'], { queryParams: { tab: 'copy', bookId: book.id } });
  }

  getBookAuthors(book: IBook): string {
    return book.authors?.map(author => author.name).filter(Boolean).join(', ') || 'N/A';
  }

  getBookStatus(book: IBook): string {
    return (book.available_copies_count ?? 0) > 0 ? 'Disponible' : 'Prestado';
  }

  getStatusText(book: IBook): string {
    const available = book.available_copies_count ?? 0;
    const total = book.copies_count ?? available;
    const borrowed = Math.max(0, total - available);

    if (this.activeTab() === 'all') {
      return `${available}/${total}`;
    } else if (this.activeTab() === 'available') {
      return available.toString();
    } else {
      return borrowed.toString();
    }
  }
}
