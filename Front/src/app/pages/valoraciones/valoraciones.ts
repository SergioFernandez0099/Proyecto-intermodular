import { Component, computed, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { RatingModule } from 'primeng/rating';

import { Menu } from '../../components/menu/menu';
import { BookService } from '../../services/book';
import { RatingService } from '../../services/rating';
import { AuthService } from '../../core/services/auth.service';
import { IBook } from '../../models/book';
import { IRating } from '../../models/rating';

@Component({
  selector: 'app-valoraciones',
  standalone: true,
  imports: [Menu, FormsModule, RatingModule, DecimalPipe, DatePipe, RouterLink],
  templateUrl: './valoraciones.html',
  styleUrl: './valoraciones.css',
})
export class Valoraciones implements OnInit {
  book = signal<IBook | null>(null);
  isLoading = signal(true);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  successMsg = signal<string | null>(null);
  errorMsg = signal<string | null>(null);

  // Formulario
  formRating = signal(0);
  formComment = signal('');

  bookId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookService: BookService,
    private ratingService: RatingService,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.bookId = Number(this.route.snapshot.paramMap.get('bookId'));
    if (!this.bookId) {
      this.router.navigate(['/explorar']);
      return;
    }
    this.loadBook();
  }

  async loadBook() {
    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(this.bookService.getBook(this.bookId));
      this.book.set(data);

      // Pre-rellenar formulario si el usuario ya valoró
      const mine = this.myRating();
      if (mine) {
        this.formRating.set(mine.rating);
        this.formComment.set(mine.comment ?? '');
      }
    } catch (err) {
      console.error('Error cargando el libro:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  /** Valoración del usuario actual (si existe) */
  myRating = computed<IRating | null>(() => {
    const currentUser = this.authService.currentUser();
    const ratings = this.book()?.ratings ?? [];
    return ratings.find((r) => r.user?.id === currentUser?.id) ?? null;
  });

  /** Otras valoraciones (excluyendo la del usuario actual) */
  otherRatings = computed<IRating[]>(() => {
    const currentUser = this.authService.currentUser();
    return (this.book()?.ratings ?? []).filter((r) => r.user?.id !== currentUser?.id);
  });

  /** ¿El usuario ya tiene una valoración? */
  hasMyRating = computed(() => this.myRating() !== null);

  // ── Submit ────────────────────────────────────────────────────────────────

  submitRating() {
    if (this.formRating() < 1 || this.formRating() > 5) {
      this.errorMsg.set('Selecciona una puntuación entre 1 y 5 estrellas.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    const payload = {
      rating: this.formRating(),
      comment: this.formComment().trim() || undefined,
    };

    const mine = this.myRating();

    if (mine) {
      // Editar con PUT
      this.ratingService.updateRating(this.bookId, payload, mine.id).subscribe({
        next: () => {
          this.successMsg.set('¡Valoración actualizada correctamente!');
          this.isSubmitting.set(false);
          this.loadBook();
        },
        error: (err) => {
          this.errorMsg.set(err.error?.message ?? 'Error al actualizar la valoración.');
          this.isSubmitting.set(false);
        },
      });
    } else {
      // Crear con POST
      this.ratingService.createRating(this.bookId, payload).subscribe({
        next: () => {
          this.successMsg.set('¡Valoración enviada correctamente!');
          this.isSubmitting.set(false);
          this.loadBook();
        },
        error: (err) => {
          this.errorMsg.set(err.error?.message ?? 'Error al enviar la valoración.');
          this.isSubmitting.set(false);
        },
      });
    }
  }

 deleteRating() {
  const mine = this.myRating();
  if (!mine) return;

  const confirmed = confirm('¿Seguro que quieres eliminar tu valoración?');
  if (!confirmed) return;

  this.isDeleting.set(true);
  this.errorMsg.set(null);
  this.successMsg.set(null);

  this.ratingService.deleteRating(this.bookId, mine.id).subscribe({
    next: () => {
      const currentBook = this.book();
      if (currentBook) {
        const updatedRatings = (currentBook.ratings ?? []).filter(r => r.id !== mine.id);
        const avgRating = updatedRatings.length > 0
          ? updatedRatings.reduce((sum, r) => sum + r.rating, 0) / updatedRatings.length
          : 0;

        // Actualiza la señal directamente → los computed reaccionan al instante
        this.book.set({
          ...currentBook,
          ratings: updatedRatings,
          average_rating: avgRating,
          ratings_count: updatedRatings.length,
        });
      }

      this.formRating.set(0);
      this.formComment.set('');
      this.successMsg.set('Valoración eliminada correctamente.');
      this.isDeleting.set(false);
    },
    error: (err) => {
      this.errorMsg.set(err.error?.message ?? 'Error al eliminar la valoración.');
      this.isDeleting.set(false);
    },
  });
}

  // ── Helpers ───────────────────────────────────────────────────────────────

  getStarsArray(value: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(value));
  }

  getUserDisplayName(rating: IRating): string {
    const u = rating.user;
    if (!u) return 'Usuario desconocido';
    return `${u.name ?? ''} ${u.lastname ?? ''}`.trim();
  }

  protected readonly Math = Math;
}
