import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Menu } from "../../components/menu/menu";
import { BookService } from '../../services/book';
import { AuthorService } from '../../services/author';
import { GenreService } from '../../services/genre';
import { IGenre } from '../../models/genre';
import { IAuthor } from '../../models/author';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { CopyService } from '../../services/copy';
import { IBook } from '../../models/book';

@Component({
  selector: 'app-anyadir-libro',
  standalone: true,
  imports: [Menu, ReactiveFormsModule, CommonModule, TranslateModule],
  templateUrl: './anyadir-libro.html',
  styleUrl: './anyadir-libro.css',
})
export class AnyadirLibro implements OnInit {
  form!: FormGroup;
  
  // Estados reactivos con Signals
  genres = signal<IGenre[]>([]);
  authors = signal<IAuthor[]>([]);
  books = signal<IBook[]>([]);
  isLoading = signal(false);
  previewImage = signal<string | null>(null);
  selectedFile = signal<File | null>(null);
  submitError = signal<string | null>(null);
  isDragging = signal(false);

  languages = [
    { label: 'Español', value: 'Español' },
    { label: 'Inglés', value: 'Inglés' },
    { label: 'Francés', value: 'Francés' },
    { label: 'Portugués', value: 'Portugués' }
  ];

  constructor(
    private _fb: FormBuilder,
    private _bookService: BookService,
    private _copyService: CopyService,
    private _authorService: AuthorService,
    private _genreService: GenreService,
    private _router: Router
  ) {}

  activeTab: string = 'newBook';

  setTab(tabName: string) {
    this.activeTab = tabName;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadInitialData();
  }

  private initializeForm(): void {
    this.form = this._fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      author_name: ['', [Validators.required]], 
      genre_id: ['', [Validators.required]],
      publication_year: [new Date().getFullYear(), [Validators.required, Validators.min(1000), Validators.max(2099)]],
      language: ['Español', [Validators.required]]
    });
  }

  private async loadInitialData(): Promise<void> {
    try {
      const [genres, authors, books] = await Promise.all([
        firstValueFrom(this._genreService.getGenres()),
        firstValueFrom(this._authorService.getAuthors()),
        firstValueFrom(this._bookService.getBooks())
      ]);
      this.genres.set(genres);
      this.authors.set(authors);
      this.books.set(books);
    } catch (error) {
      this.submitError.set('AnyadirLibro.error_cargar_datos');
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.processFile(input.files[0]);
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
    if (file && file.type.startsWith('image/')) this.processFile(file);
  }

  private processFile(file: File): void {
    this.selectedFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => this.previewImage.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  removeCover(): void {
    this.previewImage.set(null);
    this.selectedFile.set(null);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.submitError.set(null);

    try {
      const nameInput = this.form.get('author_name')?.value.trim();
      let authorId: number;

      const existingAuthor = this.authors().find(
        a => a.name.toLowerCase() === nameInput.toLowerCase()
      );

      if (existingAuthor) {
        authorId = existingAuthor.id;
      } else {
        const newAuthor = await firstValueFrom(
          this._authorService.createAuthor({ name: nameInput } as any)
        );
        authorId = newAuthor.id;
      }

      const formData = new FormData();
      formData.append('title', this.form.get('title')?.value);
      formData.append('genre_id', this.form.get('genre_id')?.value);
      formData.append('publication_year', this.form.get('publication_year')?.value.toString());
      formData.append('language', this.form.get('language')?.value);
      formData.append('author_ids[]', authorId.toString());

      if (this.selectedFile()) {
        formData.append('cover_image', this.selectedFile()!);
      }

      let book = await firstValueFrom(this._bookService.createBook(formData));
      await firstValueFrom(this._copyService.createCopy(book.id));

      this._router.navigate(['/explorar']);

    } catch (error: any) {
      this.submitError.set(error.error?.message || 'AnyadirLibro.error_crear_libro');
    } finally {
      this.isLoading.set(false);
    }
  }

  
  async onSubmitCopy(): Promise<void> {
    if (this.form.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.submitError.set(null);

    try {
      const titleInput = this.form.get('title')?.value.trim();
      let bookId: number;

      const existingBook = this.books().find(
        a => a.title.toLowerCase() === titleInput.toLowerCase()
      );

      if (existingBook) {
        bookId = existingBook.id;
      } else {
        throw new Error('Data is missing!');
      }

      await firstValueFrom(this._copyService.createCopy(bookId));

      this._router.navigate(['/explorar']);

    } catch (error: any) {
      this.submitError.set(error.error?.message || 'AnyadirLibro.error_crear_libro');
    } finally {
      this.isLoading.set(false);
    }
  }

  onCancel(): void {
    this._router.navigate(['/explorar']);
  }
}