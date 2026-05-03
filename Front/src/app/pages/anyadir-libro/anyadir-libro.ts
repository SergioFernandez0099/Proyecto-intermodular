import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Menu } from "../../components/menu/menu";
import { BookService } from '../../services/book';
import { AuthorService } from '../../services/author';
import { GenreService } from '../../services/genre';
import { IGenre } from '../../models/genre';
import { IAuthor } from '../../models/author';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
  csvFileName = signal<string | null>(null);
  csvImportMessage = signal<string | null>(null);
  csvImportError = signal<string | null>(null);

  languages = [
    { labelKey: 'AnyadirLibro.idioma_español', value: 'Español' },
    { labelKey: 'AnyadirLibro.idioma_ingles', value: 'Inglés' },
    { labelKey: 'AnyadirLibro.idioma_frances', value: 'Francés' },
    { labelKey: 'AnyadirLibro.idioma_portugues', value: 'Portugués' }
  ];

  constructor(
    private _fb: FormBuilder,
    private _bookService: BookService,
    private _copyService: CopyService,
    private _authorService: AuthorService,
    private _genreService: GenreService,
    private _router: Router,
    private _route: ActivatedRoute,
    private translate: TranslateService
  ) {}

  activeTab: string = 'newBook';

  setTab(tabName: string) {
    this.activeTab = tabName;
  }

  async ngOnInit(): Promise<void> {
    this.initializeForm();
    await this.loadInitialData();

    this._route.queryParams.subscribe(params => {
      if (params['tab'] === 'copy' && params['bookId']) {
        this.setTab('newCopy');
        const bookId = +params['bookId'];
        const book = this.books().find(b => b.id === bookId);
        if (book) {
          this.form.get('title')?.setValue(book.title);
        }
      }
    });
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

  onCsvSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.csvFileName.set(file.name);
    this.csvImportMessage.set(null);
    this.csvImportError.set(null);
    this.parseCsvFile(file);
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

 private parseCsvFile(file: File): void {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    this.csvImportError.set('AnyadirLibro.error_csv_tipo');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const text = reader.result as string;
    try {
      const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      
      if (lines.length < 2) throw new Error('AnyadirLibro.error_csv_sin_filas');

      const delimiter = lines[0].includes(';') ? ';' : ',';

      const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
      const values = lines[1].split(delimiter).map(v => v.trim());

      const row = headers.reduce((acc, header, i) => ({ ...acc, [header]: values[i] }), {} as any);

      const normalize = (str: string) => 
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

      const genreMatch = this.genres().find(g => 
        normalize(g.name) === normalize(row['genre'] || '')
      );
      
      const languageMatch = this.languages.find(l => 
        normalize(l.value) === normalize(row['language'] || '')
      );

      this.form.patchValue({
        title: row['title'] || '',
        author_name: row['author_name'] || '',
        publication_year: row['publication'] ? Number(row['publication']) : new Date().getFullYear(),
        language: languageMatch ? languageMatch.value : 'Español',
      });

      if (genreMatch) {
        this.form.get('genre_id')?.setValue(genreMatch.id);
        this.csvImportMessage.set('AnyadirLibro.csv_cargado');
        this.csvImportError.set(null);
      } else {
        this.form.get('genre_id')?.setValue('');
        this.csvImportError.set(this.translate.instant('AnyadirLibro.error_csv_genero_detalle', { genre: row['genre'] || '' }));
      }

    } catch (error: any) {
      this.csvImportError.set('AnyadirLibro.error_csv_general');
    }
  };
  reader.readAsText(file);
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

      this._router.navigate(['/misLibros']);

    } catch (error: any) {
      console.error('Error al crear libro:', error);
      this.submitError.set(error.error?.message || 'AnyadirLibro.error_crear_libro');
    } finally {
      this.isLoading.set(false);
    }
  }

  isCopyTabInvalid(): boolean {
    if (this.activeTab === 'newCopy') {
      const titleControl = this.form.get('title');
      return !titleControl || titleControl.invalid;
    }

    return this.form.invalid;
  }

  async onSubmitCopy(): Promise<void> {
    if (this.isCopyTabInvalid() || this.isLoading()) return;

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

      this._router.navigate(['/misLibros']);

    } catch (error: any) {
      console.error('Error al crear copia:', error);
      this.submitError.set(error.error?.message || 'AnyadirLibro.error_crear_copia');
    } finally {
      this.isLoading.set(false);
    }
  }

  onCancel(): void {
    this._router.navigate(['/explorar']);
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
}