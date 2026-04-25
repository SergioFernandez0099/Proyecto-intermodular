import { Component, computed, OnInit, signal } from '@angular/core';
import { Menu } from '../../components/menu/menu';
import { BookService } from '../../services/book';
import { GenreService } from '../../services/genre';
import { LoanService } from '../../services/loan';
import { TranslateModule } from '@ngx-translate/core';
import { IBook } from '../../models/book';
import { IGenre } from '../../models/genre';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [Menu, TranslateModule],
  templateUrl: './explorar.html',
  styleUrl: './explorar.css',
})
export class Explorar implements OnInit {
  // Signals para manejar el estado de la pantalla
  books = signal<IBook[]>([]);
  genres = signal<IGenre[]>([]);
  selectedGenreId = signal<number | null>(null);
  isLoading = signal<boolean>(true);
  filterText = signal('');
  
  // Signal para evitar múltiples clics en el botón de préstamo
  isProcessingLoan = signal<number | null>(null);

  // Paginación
  currentPage = signal(0);
  itemsPerPage = 8;

  constructor(
    private bookService: BookService,
    private genreService: GenreService,
    private loanService: LoanService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }


  async loadData() {
    this.isLoading.set(true);
    try {
      const [booksData, genresData] = await Promise.all([
        firstValueFrom(this.bookService.getBooks()),
        firstValueFrom(this.genreService.getGenres())
      ]);
      this.books.set(booksData);
      this.genres.set(genresData);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      this.isLoading.set(false);
    }
  }


  getLibros(): void {
    this.bookService.getBooks().subscribe({
      next: (data) => this.books.set(data),
      error: (err) => console.error('Error al refrescar libros:', err)
    });
  }

  
  pedirPrestamo(bookId: number) {
    if (this.isProcessingLoan()) return;

    this.isProcessingLoan.set(bookId);

    this.loanService.createLoan(bookId).subscribe({
      next: (res) => {
        alert('¡Libro reservado con éxito!');
        this.isProcessingLoan.set(null);
        this.getLibros(); 
      },
      error: (err) => {
        this.isProcessingLoan.set(null);
        const mensaje = err.error?.message || 'Error al solicitar el préstamo';
        alert(mensaje);
      }
    });
  }

  // --- COMPUTED PROPERTIES (FILTRADO Y PAGINACIÓN) ---

  filteredBooks = computed(() => {
    let result = this.books();
    const term = this.filterText().toLowerCase().trim();
    const genreId = this.selectedGenreId();

    if (genreId !== null) {
      result = result.filter(book => book.genre_id === genreId || book.genre?.id === genreId);
    }

    if (term) {
      result = result.filter(book => 
        book.title.toLowerCase().includes(term) || 
        book.authors?.some(author => author.name?.toLowerCase().includes(term))
      );
    }

    return result;
  });

  totalPages = computed(() => {
    const count = this.filteredBooks().length;
    return Math.ceil(count / this.itemsPerPage) || 1;
  });

  paginatedBooks = computed(() => {
    const start = this.currentPage() * this.itemsPerPage;
    return this.filteredBooks().slice(start, start + this.itemsPerPage);
  });

  // --- MÉTODOS DE APOYO PARA LA UI ---

  setGenre(id: number | null) {
    this.selectedGenreId.set(id);
    this.currentPage.set(0); 
  }

  onSearch(event: Event) {
    const element = event.target as HTMLInputElement;
    this.filterText.set(element.value);
    this.currentPage.set(0); 
  }

  getBookAuthors(book: IBook): string | undefined {
    return book.authors?.map(auth => auth.name).join(', ');
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