import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Menu } from '../../components/menu/menu';
import { TranslateService } from '@ngx-translate/core';
import { BookService } from '../../services/book';
import { GenreService } from '../../services/genre';
import { AuthorService } from '../../services/author';
import { IBook } from '../../models/book';
import { IGenre } from '../../models/genre';
import { IAuthor } from '../../models/author';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-mis-libros',
  standalone: true,
  imports: [Menu, CommonModule, TranslateModule, FormsModule, ReactiveFormsModule],
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

  // Modal de edición
  showEditModal = signal(false);
  editingBook = signal<IBook | null>(null);
  editForm!: FormGroup;
  genres = signal<IGenre[]>([]);
  authors = signal<IAuthor[]>([]);
  previewImage = signal<string | null>(null);
  selectedFile = signal<File | null>(null);
  isDragging = signal(false);
  isSubmitting = signal(false);
  editError = signal<string | null>(null);

  languages = [
    { labelKey: 'AnyadirLibro.idioma_español', value: 'Español' },
    { labelKey: 'AnyadirLibro.idioma_ingles', value: 'Inglés' },
    { labelKey: 'AnyadirLibro.idioma_frances', value: 'Francés' },
    { labelKey: 'AnyadirLibro.idioma_portugues', value: 'Portugués' }
  ];

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
    private bookService: BookService,
    private genreService: GenreService,
    private authorService: AuthorService,
    private fb: FormBuilder,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadMyBooks();
    this.initializeEditForm();
  }

  private initializeEditForm(): void {
    this.editForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      genre_id: ['', [Validators.required]],
      publication_year: [new Date().getFullYear(), [Validators.required, Validators.min(1000), Validators.max(2099)]],
      language: ['Español', [Validators.required]]
    });
  }

  private loadMyBooks(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.bookService.getMyBooks().subscribe({
      next: books => {
        this.books.set(books);
        this.isLoading.set(false);
        this.loadGenresAndAuthors();
      },
      error: error => {
        console.error('Error al cargar Mis Libros:', error);
        this.errorMessage.set('MisLibros.error_carga');
        this.isLoading.set(false);
      }
    });
  }

  private async loadGenresAndAuthors(): Promise<void> {
    try {
      const [genres, authors] = await Promise.all([
        firstValueFrom(this.genreService.getGenres()),
        firstValueFrom(this.authorService.getAuthors())
      ]);
      this.genres.set(genres);
      this.authors.set(authors);
    } catch (error) {
      console.error('Error al cargar géneros o autores:', error);
    }
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
    return book.authors?.map(author => author.name).filter(Boolean).join(', ') || this.translate.instant('MisLibros.no_disponible');
  }

  getBookStatus(book: IBook): string {
    return (book.available_copies_count ?? 0) > 0
      ? this.translate.instant('MisLibros.estado.disponible')
      : this.translate.instant('MisLibros.estado.prestado');
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

  translateGenreName(name?: string): string {
    if (!name) {
      return '';
    }

    const normalizedName = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    const genreKeyMap: Record<string, string> = {
      ficcion: 'Explorar.categorias.ficcion',
      fiction: 'Explorar.categorias.ficcion',
      ciencia: 'Explorar.categorias.ciencia',
      science: 'Explorar.categorias.ciencia',
      historia: 'Explorar.categorias.historia',
      history: 'Explorar.categorias.historia',
      biografias: 'Explorar.categorias.biografias',
      biographies: 'Explorar.categorias.biografias',
      arte: 'Explorar.categorias.arte',
      art: 'Explorar.categorias.arte',
      tecnologia: 'Explorar.categorias.tecnologia',
      technology: 'Explorar.categorias.tecnologia'
    };

    const translationKey = genreKeyMap[normalizedName];
    return translationKey ? this.translate.instant(translationKey) : name;
  }

  // ========== Métodos de Edición ==========

  openEditModal(book: IBook): void {
    this.editingBook.set(book);
    this.previewImage.set(book.cover_image);
    this.selectedFile.set(null);
    this.editError.set(null);
    this.isSubmitting.set(false);
    
    this.editForm.patchValue({
      title: book.title,
      genre_id: book.genre_id,
      publication_year: book.publication_year || new Date().getFullYear(),
      language: 'Español'
    });
    
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingBook.set(null);
    this.previewImage.set(null);
    this.selectedFile.set(null);
    this.editError.set(null);
    this.editForm.reset();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.processFile(input.files[0]);
    }
  }

  private processFile(file: File): void {
    this.selectedFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => this.previewImage.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) {
      this.processFile(file);
    }
  }

  removeCover(): void {
    this.previewImage.set(null);
    this.selectedFile.set(null);
  }

  saveChanges(): void {
    if (!this.editForm.valid || !this.editingBook()) {
      return;
    }

    this.isSubmitting.set(true);
    this.editError.set(null);

    const book = this.editingBook()!;
    const formValue = this.editForm.value;

    const updatedBook: Partial<IBook> = {
      title: formValue.title,
      genre_id: formValue.genre_id,
      publication_year: formValue.publication_year,
    };

    this.bookService.updateBook(updatedBook as IBook, book.id).subscribe({
      next: () => {
        // Si hay nueva imagen, actualizar la portada
        if (this.selectedFile()) {
          this.bookService.updateCover(this.selectedFile()!, book.id).subscribe({
            next: () => {
              this.loadMyBooks();
              this.closeEditModal();
            },
            error: () => {
              this.editError.set('MisLibros.error_portada');
              this.isSubmitting.set(false);
            }
          });
        } else {
          this.loadMyBooks();
          this.closeEditModal();
        }
      },
      error: (error) => {
        console.error('Error al actualizar libro:', error);
        this.editError.set('MisLibros.error_guardar');
        this.isSubmitting.set(false);
      }
    });
  }

  deleteBook(book: IBook): void {
    if (!confirm(this.translate.instant('MisLibros.confirmar_eliminar', { title: book.title }))) {
      return;
    }

    this.isSubmitting.set(true);
    this.bookService.deleteBook(book.id).subscribe({
      next: () => {
        this.loadMyBooks();
        this.closeEditModal();
      },
      error: (error) => {
        console.error('Error al eliminar libro:', error);
        this.editError.set('MisLibros.error_eliminar');
        this.isSubmitting.set(false);
      }
    });
  }
}
