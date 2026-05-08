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
import { SERVER_BASE } from '../../core/constants/api';
import { CopyService } from '../../services/copy';
import { ICopy } from '../../models/copy';

@Component({
  selector: 'app-mis-libros',
  standalone: true,
  imports: [Menu, CommonModule, TranslateModule, FormsModule, ReactiveFormsModule],
  templateUrl: './mis-libros.html',
  styleUrl: './mis-libros.css',
})
export class MisLibros implements OnInit {
  copies = signal<ICopy[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  activeTab = signal<'all' | 'available' | 'borrowed'>('all');
  filterText = signal('');
  selectedGenreId = signal<'all' | number>('all');
  currentPage = signal(0);
  coverRemoved = signal(false);
  itemsPerPage = 3;
  showColumnModal = signal(false);
  toast = signal<{ message: string; type: 'error' | 'success' } | null>(null);

  readonly columns = [
    { key: 'cover', labelKey: 'MisLibros.tabla.portada' },
    { key: 'book', labelKey: 'MisLibros.tabla.libro' },
    { key: 'state', labelKey: 'MisLibros.tabla.estado' },
    { key: 'actions', labelKey: 'MisLibros.tabla.acciones' }
  ] as const;

  visibleColumns = signal<Record<string, boolean>>({
    cover: true,
    book: true,
    state: true,
    actions: true
  });

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
    const selectedGenre = this.selectedGenreId();
    return this.copies()
      .filter(book => {
        if (selectedGenre !== 'all' && book.book?.genre_id !== selectedGenre) {
          return false;
        }

        if (this.activeTab() === 'available') {
          return book.state === "available";
        }

        if (this.activeTab() === 'borrowed') {
          return book.state === "borrowed";
        }

        return true;
      })
      .filter(book => {
        if (!search) return true;
        const title = book.book?.title?.toLowerCase();
        const authors = book.book?.authors?.map(author => author.name?.toLowerCase() ?? '').join(' ') ?? '';
        return title?.includes(search) || authors.includes(search);
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

  totalCount = computed(() => this.copies().length);
  availableCount = computed(() => this.copies().filter(book => book.state === "available").length);
  borrowedCount = computed(() => this.copies().filter(book => book.state === "borrowed").length);

  constructor(
    private router: Router,
    private bookService: BookService,
    private copyService: CopyService,
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

    this.copyService.getMyCopies().subscribe({
      next: copies => {
        this.copies.set(copies);
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

  getImageUrl(path: string | null | undefined): string {
  if (!path) {
    return 'https://placehold.co/80x120?text=Sin+portada';
  }

  if (path.startsWith('http')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${SERVER_BASE}/storage/${cleanPath}`;
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

  onGenreFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    this.selectedGenreId.set(value === 'all' ? 'all' : Number(value));
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

  goAddBook(): void {
    this.router.navigate(['/añadirLibro']);
  }

  goAddCopy(book: IBook): void {
    this.router.navigate(['/añadirLibro'], { queryParams: { tab: 'copy', bookId: book.id } });
  }

  getBookAuthors(book: ICopy): string {
    return book.book?.authors?.map(author => author.name).filter(Boolean).join(', ') || this.translate.instant('MisLibros.no_disponible');
  }

  getBookStatus(book: IBook): string {
    return (book.available_copies_count ?? 0) > 0
      ? this.translate.instant('MisLibros.estado.disponible')
      : this.translate.instant('MisLibros.estado.prestado');
  }

  getStatusText(book: ICopy): string {
    const available = book.book?.available_copies_count ?? 0;
    const total = book.book?.copies_count ?? available;
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


  openEditModal(book: IBook): void {
    this.editingBook.set(book);
    this.previewImage.set(this.getCoverUrl(book.cover_image));
    this.selectedFile.set(null);
    this.editError.set(null);
    this.isSubmitting.set(false);
    this.coverRemoved.set(false); // 👈 añadir esto
    this.showEditModal.set(true);

    this.editForm.patchValue({
      title: book.title,
      genre_id: book.genre?.id,
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
    this.coverRemoved.set(false);

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
    this.coverRemoved.set(true);
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
        if (this.selectedFile()) {
          // Caso 1: hay nueva portada → subir
          this.bookService.updateCover(this.selectedFile()!, book.id).subscribe({
            next: () => { this.loadMyBooks(); this.closeEditModal(); },
            error: () => { this.editError.set('MisLibros.error_portada'); this.isSubmitting.set(false); }
          });
        } else if (this.coverRemoved()) {
          // Caso 2: se borró la portada → llamar a deleteCover
          this.bookService.deleteCover(book.id).subscribe({
            next: () => { this.loadMyBooks(); this.closeEditModal(); },
            error: () => { this.editError.set('MisLibros.error_portada'); this.isSubmitting.set(false); }
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

deleteBook(copy: ICopy): void {
  if (!confirm(this.translate.instant('MisLibros.confirmar_eliminar', { title: copy.book?.title }))) {
    return;
  }

  this.isSubmitting.set(true);

  this.copyService.deleteCopy(copy).subscribe({
    next: () => {

      this.showToast(this.translate.instant('MisLibros.exito_eliminar'), 'success');
      this.loadMyBooks();
      this.isSubmitting.set(false);
    },
    error: (err) => {
      this.isSubmitting.set(false);
      console.error('Error capturado:', err);

      let errorMsg = this.translate.instant('error.error_generico');

      if (err.error && typeof err.error === 'string' && err.error.includes('prestada')) {
          errorMsg = this.translate.instant('error.copia_prestada');
      } else if (err.error?.errors) {
        const firstKey = Object.keys(err.error.errors)[0];
        const backendMessage = err.error.errors[firstKey][0];

        if (backendMessage.toLowerCase().match(/prestada|loan|prêté|emprestada/)) {
          errorMsg = this.translate.instant('error.copia_prestada');
        } else {
          errorMsg = backendMessage;
        }
      }

      this.showToast(errorMsg, 'error');
    }
  });
}

  private showToast(message: string, type: 'error' | 'success') {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }
}
