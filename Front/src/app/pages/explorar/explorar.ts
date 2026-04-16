import { Component, computed, OnInit, signal } from '@angular/core';
import { Menu } from '../../components/menu/menu';
import { BookService } from '../../services/book';
import { TranslateModule } from '@ngx-translate/core';
import { IBook } from '../../models/book';

@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [Menu,TranslateModule],
  templateUrl: './explorar.html',
  styleUrl: './explorar.css',
})
export class Explorar implements OnInit{
  books = signal<IBook[]>([]);
  isLoading = signal<boolean>(true);
  filterText = signal('');
  currentPage = signal(0);
  itemsPerPage = 8;

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.getLibros();
  }


  filteredBooks = computed(() => {
    const term = this.filterText().toLowerCase().trim();
    if (!term) return this.books();

    return this.books().filter(book => 
      book.title.toLowerCase().includes(term) || 
      book.authors?.some(author => author.name?.toLowerCase().includes(term))
    );
  });

  totalPages = computed(() => {
    const count = this.filteredBooks().length;
    return Math.ceil(count / this.itemsPerPage) || 1;
  });

  paginatedBooks = computed(() => {
    const start = this.currentPage() * this.itemsPerPage;
    return this.filteredBooks().slice(start, start + this.itemsPerPage);
  });

  onSearch(event: Event) {
    const element = event.target as HTMLInputElement;
    this.filterText.set(element.value);
    this.currentPage.set(0); 
  }


  getLibros(): void {
    this.isLoading.set(true);

    this.bookService.getBooks().subscribe({
      next: (data) => {
        this.books.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al obtener libros:', err);
        this.isLoading.set(false);
      }
    });
  }

  getBookAuthors(book: IBook): string | undefined {
    const result = book.authors?.map(auth => auth.name).join(', ');
    return result;
  }

  nextPage() {
    if (this.currentPage() + 1 < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
    }
  }
}
