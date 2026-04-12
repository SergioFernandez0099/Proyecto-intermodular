# Guía de Integración Frontend (Angular) — API REST Laravel

**Base URL (desarrollo):** `http://localhost:8000`  
**Frontend esperado en:** `http://localhost:5173` o `http://localhost:3000`

---

## Índice

1. [Configuración inicial de Angular](#1-configuración-inicial-de-angular)
2. [Gestión de Cookies y CSRF](#2-gestión-de-cookies-y-csrf)
3. [Modelos TypeScript](#3-modelos-typescript)
4. [Referencia de Endpoints](#4-referencia-de-endpoints)
   - [Auth](#41-auth)
   - [Géneros](#42-géneros)
   - [Autores](#43-autores)
   - [Libros](#44-libros)
   - [Copias](#45-copias)
   - [Valoraciones](#46-valoraciones)
   - [Préstamos](#47-préstamos)
   - [Usuarios (Admin)](#48-usuarios-solo-admin)
5. [Google OAuth](#5-google-oauth)
6. [Manejo de errores](#6-manejo-de-errores)

---

## 1. Configuración inicial de Angular

### 1.1 `app.config.ts` — Habilitar cookies en todas las peticiones

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { csrfInterceptor } from './core/interceptors/csrf.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([csrfInterceptor]),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',      // nombre de la cookie que Laravel emite
        headerName: 'X-XSRF-TOKEN',    // header que Laravel espera recibir
      })
    ),
  ],
};
```

### 1.2 Interceptor base — `withCredentials` global

> **Crítico:** Sin `withCredentials: true` el navegador NO envía las cookies de sesión en peticiones cross-origin y toda autenticación falla silenciosamente con 401.

```typescript
// src/app/core/interceptors/csrf.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  // Clona la petición añadiendo withCredentials a TODAS las requests
  const cloned = req.clone({ withCredentials: true });
  return next(cloned);
};
```

### 1.3 Constante de la URL base

```typescript
// src/app/core/constants/api.ts
export const API_BASE = 'http://localhost:8000/api';
export const SERVER_BASE = 'http://localhost:8000';
```

---

## 2. Gestión de Cookies y CSRF

### Cómo funciona la autenticación

La API usa **Sanctum en modo stateful (cookie-based)**. No hay tokens Bearer. El navegador gestiona las cookies automáticamente, pero hay un paso previo **obligatorio** antes de login/register.

### Flujo completo de autenticación

```
┌─────────────────────────────────────────────────────────────────┐
│  PASO 0 (una sola vez al iniciar la app o antes de login)       │
│  GET /sanctum/csrf-cookie                                       │
│  ← Set-Cookie: XSRF-TOKEN (legible por JS)                     │
│  ← Set-Cookie: laravel-session (httpOnly, no legible por JS)   │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│  PASO 1 — Login / Register                                      │
│  POST /api/auth/login                                           │
│  Header automático: X-XSRF-TOKEN: <valor leído de la cookie>   │
│  Cookie automática: laravel-session=<id>                        │
│  ← 200 OK: { data: { id, name, lastname, email, role, active }} │
│  ← Set-Cookie: laravel-session=<nuevo-id> (renovada)           │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│  PASO 2+ — Peticiones autenticadas                              │
│  GET/POST/... /api/cualquier-ruta                               │
│  Cookie: laravel-session=<id>  ← navegador la envía solo       │
│  Header: X-XSRF-TOKEN: <token> ← Angular lo añade solo (*)     │
└─────────────────────────────────────────────────────────────────┘
```

(*) Angular con `withXsrfConfiguration` lee la cookie `XSRF-TOKEN` y la envía como header automáticamente en peticiones de escritura.

### Servicio de Auth en Angular

```typescript
// src/app/core/services/auth.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, switchMap } from 'rxjs/operators';
import { from } from 'rxjs';
import { API_BASE, SERVER_BASE } from '../constants/api';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  currentUser = signal<User | null>(null);

  /** Debe llamarse UNA VEZ antes de login/register para obtener el CSRF cookie */
  getCsrfCookie() {
    return this.http.get(`${SERVER_BASE}/sanctum/csrf-cookie`);
  }

  login(email: string, password: string) {
    // Primero obtenemos el CSRF cookie, luego hacemos login
    return this.getCsrfCookie().pipe(
      switchMap(() =>
        this.http.post<{ data: User }>(`${API_BASE}/auth/login`, { email, password })
      ),
      tap(res => this.currentUser.set(res.data))
    );
  }

  register(name: string, lastname: string, email: string, password: string, password_confirmation: string) {
    return this.getCsrfCookie().pipe(
      switchMap(() =>
        this.http.post<{ data: User }>(`${API_BASE}/auth/register`, {
          name, lastname, email, password, password_confirmation
        })
      ),
      tap(res => this.currentUser.set(res.data))
    );
  }

  logout() {
    return this.http.post(`${API_BASE}/auth/logout`, {}).pipe(
      tap(() => this.currentUser.set(null))
    );
  }

  me() {
    return this.http.get<{ data: User }>(`${API_BASE}/auth/me`).pipe(
      tap(res => this.currentUser.set(res.data))
    );
  }
}
```

### ¿Cuándo llamar a `getCsrfCookie()`?

| Situación | ¿Llamar antes? |
|---|---|
| Login | ✅ Sí (el servicio ya lo hace internamente) |
| Register | ✅ Sí (el servicio ya lo hace internamente) |
| Cualquier GET autenticado | ❌ No necesario |
| POST/PUT/PATCH/DELETE autenticado | ❌ No necesario (la cookie ya está establecida) |
| Al refrescar la página (app init) | Llamar a `me()` para restaurar sesión |

### App Initializer — restaurar sesión al recargar

```typescript
// src/app/app.config.ts  (añadir al providers)
import { APP_INITIALIZER } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { catchError, of } from 'rxjs';

function initAuth(authService: AuthService) {
  return () => authService.me().pipe(catchError(() => of(null)));
}

// En providers:
{
  provide: APP_INITIALIZER,
  useFactory: (auth: AuthService) => initAuth(auth),
  deps: [AuthService],
  multi: true,
}
```

---

## 3. Modelos TypeScript

```typescript
// src/app/core/models/

export interface User {
  id: number;
  name: string;
  lastname: string;
  email: string;
  role: 'user' | 'admin';
  active: boolean;
  loans?: Loan[];  // solo visible si el usuario que consulta es admin
}

export interface Genre {
  id: number;
  name: string;
}

export interface Author {
  id: number;
  name: string;
  books?: { id: number; title: string }[];
}

export interface Book {
  id: number;
  title: string;
  cover_image: string | null;   // URL completa al storage público, o null
  publication_year: number | null;
  genre?: { id: number; name: string };
  authors?: { id: number; name: string }[];
  available?: boolean;          // true si alguna copia tiene state='available'
  ratings_count?: number;
  average_rating?: number | null;
  ratings?: Rating[];
}

export interface Copy {
  id: number;
  code: string;                 // formato: "COPY-{book_id}-{timestamp}-{random}"
  state: 'available' | 'borrowed';
  book?: { id: number; title: string };
}

export interface Rating {
  id: number;
  rating: number;               // 1-5
  comment: string | null;
  edited?: boolean;
  created_at?: string;
  user?: { id: number; name: string };
}

export interface Loan {
  id: number;
  loan_date: string;            // ISO datetime
  return_date: string | null;   // null si no ha sido devuelto
  copy?: {
    id: number;
    code: string;
    book?: {
      id: number;
      title: string;
      cover_image: string | null;
      genre?: { id: number; name: string };
      authors?: { id: number; name: string }[];
    };
  };
  user?: { id: number; name: string };  // solo visible para admins
}

// Wrapper genérico de respuesta de Laravel
export interface ApiResponse<T> {
  data: T;
}

export interface ApiListResponse<T> {
  data: T[];
}
```

---

## 4. Referencia de Endpoints

> **Convención de respuestas:**
> - Colecciones: `{ "data": [...] }`
> - Recursos únicos: `{ "data": { ... } }`
> - Sin contenido: HTTP 204 (sin body)
> - Error: `{ "message": "..." }` o `{ "message": "...", "errors": { campo: ["..."] } }`

### 4.1 Auth

#### `POST /api/auth/register` — Registro
**Sin autenticación requerida** (pero sí CSRF cookie previa)

```typescript
// Request body
{
  name: string;               // requerido
  lastname: string;           // requerido
  email: string;              // requerido, único
  password: string;           // requerido, mínimo 8 caracteres
  password_confirmation: string; // requerido, debe coincidir
}

// Response 201
{ data: User }
```

---

#### `POST /api/auth/login` — Login
**Sin autenticación requerida** (pero sí CSRF cookie previa)

```typescript
// Request body
{
  email: string;
  password: string;
}

// Response 200
{ data: User }

// Errores posibles
// 422 — Credenciales incorrectas: { message, errors: { "email or password": [...] } }
// 403 — Cuenta desactivada: { message: "Cuenta desactivada." }
```

---

#### `POST /api/auth/logout` — Logout
**Requiere autenticación**

```typescript
// Sin body
// Response 200
{ message: "Sesión cerrada correctamente." }
```

---

#### `GET /api/auth/me` — Usuario actual
**Requiere autenticación**

```typescript
// Response 200
{ data: User }
```

---

#### `PUT /api/auth/me` — Actualizar perfil propio
**Requiere autenticación**

```typescript
// Request body (todos opcionales)
{
  name?: string;
  lastname?: string;
  email?: string;
  password?: string;           // mínimo 8 caracteres
  password_confirmation?: string;
}

// Response 200
{ data: User }
```

---

#### `DELETE /api/auth/me` — Desactivar cuenta propia
**Requiere autenticación**

```typescript
// Sin body — la cuenta queda con active=false (soft disable)
// Response 204 — sin body
```

---

### 4.2 Géneros

#### `GET /api/genres` — Listar todos
**Requiere autenticación**

```typescript
// Response 200
{ data: Genre[] }
```

#### `GET /api/genres/{id}` — Ver uno
**Requiere autenticación**

```typescript
// Response 200
{ data: Genre }
```

#### `POST /api/genres` — Crear *(solo admin)*
```typescript
// Body
{ name: string }  // único

// Response 201 (nota: puede variar, verificar)
{ data: Genre }
```

#### `PUT /api/genres/{id}` — Actualizar *(solo admin)*
```typescript
{ name?: string }
// Response 200
{ data: Genre }
```

#### `DELETE /api/genres/{id}` — Eliminar *(solo admin)*
```typescript
// Response 204
```

---

### 4.3 Autores

#### `GET /api/authors` — Listar todos
**Requiere autenticación**

```typescript
{ data: Author[] }
```

#### `GET /api/authors/{id}` — Ver uno
```typescript
{ data: Author }
```

#### `POST /api/authors` — Crear *(solo admin)*
```typescript
// Body
{ name: string }  // único

{ data: Author }
```

#### `PUT /api/authors/{id}` — Actualizar *(solo admin)*
```typescript
{ name?: string }
```

#### `DELETE /api/authors/{id}` — Eliminar *(solo admin)*
```typescript
// Response 204
```

---

### 4.4 Libros

#### `GET /api/books` — Listar libros (de otros usuarios)
**Requiere autenticación** — Solo devuelve libros que NO son del usuario logueado, y cuyo dueño esté activo.

```typescript
// Query params opcionales
?genre_id=1        // filtra por género
?search=quijote    // filtra por título (LIKE)

// Response 200
{
  data: Book[]  // cada Book incluye: genre, authors, copies (para calcular available), 
}               // ratings_count, average_rating
```

#### `GET /api/books/mine` — Mis libros
**Requiere autenticación** — Solo los libros del usuario autenticado.

```typescript
?search=quijote    // filtro opcional

{ data: Book[] }
```

> [!IMPORTANT]
> Llamar a `/api/books/mine` ANTES de `/api/books/{id}` si necesitas acceder a un libro propio, ya que `/api/books` excluye los propios.

#### `GET /api/books/{id}` — Ver libro concreto
**Requiere autenticación**

Devuelve el libro con género, autores, copias, valoraciones con usuarios.

```typescript
{ data: Book }  // Book con todos los campos incluyendo ratings[]
```

**Autorización:** propio dueño siempre puede; otros solo si el dueño está activo.

#### `POST /api/books` — Crear libro
**Requiere autenticación** — El libro queda a nombre del usuario autenticado.

```typescript
// Content-Type: multipart/form-data (si hay imagen) o application/json (sin imagen)
{
  title: string;              // requerido
  genre_id: number;           // requerido, debe existir
  publication_year?: number;  // opcional, 1000-2099
  cover_image?: File;         // opcional, jpeg/png/webp, max 2MB
  author_ids: number[];       // requerido, al menos 1, deben existir
}

// Response 201
{ data: Book }

// Error 422 si ya existe un libro con el mismo título y alguno de los mismos autores
```

#### `PUT /api/books/{id}` — Actualizar libro
**Requiere ser el dueño** (o admin)

```typescript
{
  title?: string;
  genre_id?: number;
  publication_year?: number | null;
  author_ids?: number[];
}
// Response 200
{ data: Book }
```

#### `DELETE /api/books/{id}` — Eliminar libro
**Requiere ser el dueño** (o admin)

```typescript
// Response 204
// Error 422 si el libro tiene copias vinculadas a préstamos activos
```

#### `POST /api/books/{id}/cover` — Subir/actualizar portada
**Requiere ser el dueño** (o admin)

```typescript
// Content-Type: multipart/form-data
{ cover_image: File }  // jpeg/png/webp, max 2MB

// Response 200
{ data: Book }
```

#### `DELETE /api/books/{id}/cover` — Eliminar portada
**Requiere ser el dueño** (o admin)

```typescript
// Response 204
```

#### `POST /api/books/import` — Importar libros por CSV
**Requiere autenticación**

```typescript
// Content-Type: multipart/form-data
{ file: File }  // CSV/TXT, max 2MB

// Formato del CSV esperado (con cabecera):
// title,genre_id,publication_year,author_ids
// "Don Quijote",1,1605,"1|2"   ← author_ids separados por |

// Response 200
{
  imported_count: number;
  failed_count: number;
  imported_ids: number[];
  failed: { row: number; data: object; errors: object }[];
}
```

---

### 4.5 Copias

#### `GET /api/books/{bookId}/copies` — Copias de un libro
**Requiere autenticación** — Solo el dueño del libro (o admin) puede ver las copias.

```typescript
{ data: Copy[] }
// Copy: { id, code, state: 'available'|'borrowed', book: { id, title } }
```

#### `POST /api/books/{bookId}/copies` — Añadir copias
**Requiere ser dueño del libro** (o admin)

```typescript
{ quantity?: number }  // opcional, 1-50, por defecto 1

// Response 200
{ data: Copy[] }
```

#### `PATCH /api/books/{bookId}/copies/{copyId}` — Cambiar estado de copia *(solo admin)*

```typescript
{ state: 'available' | 'borrowed' }

// Response 200
{ data: Copy }
```

#### `DELETE /api/books/{bookId}/copies/{copyId}` — Eliminar copia
**Requiere ser dueño del libro** (o admin)

```typescript
// Response 204
// Error 422 si la copia está en estado 'borrowed'
```

---

### 4.6 Valoraciones

#### `POST /api/books/{bookId}/ratings` — Crear/actualizar valoración
**Requiere autenticación** — Un usuario solo puede tener una valoración por libro; si ya existe, la actualiza.

```typescript
{
  rating: number;    // requerido, 1-5
  comment?: string;  // opcional, max 1000 caracteres
}

// Response 200
{ data: Rating }
```

#### `PUT /api/books/{bookId}/ratings/{ratingId}` — Actualizar valoración
**Requiere ser el autor de la valoración** (o admin)

```typescript
{
  rating?: number;
  comment?: string | null;
}

// Response 200
{ data: Rating }
```

#### `DELETE /api/books/{bookId}/ratings/{ratingId}` — Eliminar valoración
**Requiere ser el autor de la valoración** (o admin)

```typescript
// Response 204
```

---

### 4.7 Préstamos

#### `GET /api/loans` — Listar préstamos
**Requiere autenticación**
- Usuario normal: solo ve sus propios préstamos.
- Admin: ve todos los préstamos (con campo `user` incluido).

```typescript
// Response 200
{ data: Loan[] }
// Loan incluye: copy.book.genre, copy.book.authors
// Si admin: también incluye user: { id, name }
```

#### `GET /api/loans/{id}` — Ver préstamo concreto
**Requiere ser el dueño** del préstamo (o admin)

```typescript
{ data: Loan }
```

#### `POST /api/loans` — Crear préstamo (pedir libro prestado)
**Requiere autenticación**

```typescript
{ book_id: number }  // requerido

// Response 201 (nota: puede devolver 200, verificar en práctica)
{ data: Loan }

// Errores posibles:
// 422 — "No hay copias disponibles para este libro."
// 422 — "No puedes tomar prestado un libro tuyo."
```

#### `PATCH /api/loans/{id}/return` — Devolver préstamo
**Requiere ser el dueño** del préstamo (o admin)

```typescript
// Sin body
// Response 200
{ data: Loan }  // con return_date rellenado

// Error 422 si el préstamo ya fue devuelto
```

---

### 4.8 Usuarios (solo admin)

Todos los endpoints de este grupo requieren `role: 'admin'`.

#### `GET /api/users` — Listar todos los usuarios

```typescript
{ data: User[] }
```

#### `GET /api/users/{id}` — Ver usuario

```typescript
{ data: User }
```

#### `PUT /api/users/{id}` — Actualizar usuario

```typescript
{
  name?: string;
  lastname?: string;
  email?: string;
  role?: 'user' | 'admin';
}

{ data: User }
```

#### `PATCH /api/users/{id}/activate` — Activar usuario

```typescript
// Sin body
{ data: User }  // active: true
```

#### `PATCH /api/users/{id}/deactivate` — Desactivar usuario

```typescript
// Sin body — también revoca todas sus sesiones activas
{ data: User }  // active: false
```

#### `DELETE /api/users/{id}` — Eliminar usuario permanentemente

```typescript
// Response 204
```

---

## 5. Google OAuth

### Descripción del flujo

Google OAuth con Laravel Socialite **requiere redirigir el navegador completo** (no es una llamada `fetch`/`HttpClient`). El flujo es:

```
Navegador → [redirect completo] → /auth/google/redirect
    → Google OAuth consent screen
    → Google → [redirect] → /auth/google/callback (servidor Laravel)
    → Laravel autentica al usuario, establece cookie de sesión
    → Laravel → [redirect] → http://localhost:5173/dashboard (o /login?error=...)
    → Angular ya tiene la cookie de sesión establecida
    → Angular llama a GET /api/auth/me para obtener datos del usuario
```

### Implementación en Angular

```typescript
// google-login.component.ts o en el AuthService

loginWithGoogle(): void {
  // IMPORTANTE: window.location.href, no HttpClient
  // El navegador debe navegar completo para que Laravel pueda:
  // 1. Guardar el 'state' OAuth en la sesión
  // 2. Establecer la cookie de sesión después del callback
  window.location.href = 'http://localhost:8000/auth/google/redirect';
}
```

### Manejar el callback en Angular (ruta `/dashboard`)

Después de que Google hace callback a Laravel y Laravel redirige al frontend, Angular debe verificar si hay sesión activa:

```typescript
// dashboard.component.ts o en un guard
import { Component, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({ ... })
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    // El APP_INITIALIZER ya habrá llamado a me() y establecido currentUser
    // Si el usuario no está autenticado tras el redirect, redirige a login
    if (!this.authService.currentUser()) {
      this.router.navigate(['/login']);
    }
  }
}
```

### Manejar errores de Google OAuth

Si la cuenta está desactivada, Laravel redirige a:
```
http://localhost:5173/login?error=cuenta_desactivada
```

```typescript
// login.component.ts
import { ActivatedRoute } from '@angular/router';

ngOnInit() {
  this.route.queryParams.subscribe(params => {
    if (params['error'] === 'cuenta_desactivada') {
      this.errorMessage = 'Tu cuenta ha sido desactivada. Contacta con el administrador.';
    }
  });
}
```

### Ruta de Angular para el callback de Google

> [!NOTE]
> Angular **no necesita** una ruta especial para el callback de Google. El callback lo gestiona Laravel en `/auth/google/callback` (ruta del backend). Laravel hace el redirect final al frontend en `/dashboard`.
> Solo asegúrate de que Angular tenga una ruta `/dashboard` configurada.

---

## 6. Manejo de errores

### Códigos de respuesta

| Código | Significado |
|---|---|
| `200` | OK |
| `201` | Creado correctamente |
| `204` | Sin contenido (DELETE exitoso) |
| `401` | No autenticado → redirigir a login |
| `403` | Sin permiso (rol insuficiente o cuenta desactivada) |
| `404` | Recurso no encontrado |
| `405` | Método HTTP no permitido |
| `419` | CSRF token expirado/inválido → llamar a `getCsrfCookie()` y reintentar |
| `422` | Error de validación → ver campo `errors` |
| `429` | Demasiadas peticiones |
| `500` | Error interno del servidor |

### Interceptor de errores global

```typescript
// src/app/core/interceptors/error.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          router.navigate(['/login']);
          break;
        case 403:
          // Mostrar mensaje o redirigir
          break;
        case 419:
          // CSRF expirado — recargar o pedir cookie de nuevo
          console.warn('CSRF token expirado. Recargando...');
          window.location.reload();
          break;
      }
      return throwError(() => error);
    })
  );
};
```

### Estructura de respuesta de error de validación (422)

```json
{
  "message": "Datos inválidos.",
  "errors": {
    "email": ["El campo email es obligatorio."],
    "password": ["El campo password debe tener al menos 8 caracteres."]
  }
}
```

```typescript
// Cómo leerlo en Angular
this.authService.login(email, password).subscribe({
  error: (err: HttpErrorResponse) => {
    if (err.status === 422) {
      const validationErrors = err.error.errors;
      // validationErrors es un objeto { campo: string[] }
      Object.entries(validationErrors).forEach(([field, messages]) => {
        console.log(`${field}: ${(messages as string[]).join(', ')}`);
      });
    }
  }
});
```

---

## Checklist de integración

- [ ] `withCredentials: true` en el interceptor global
- [ ] `withXsrfConfiguration` configurado con `XSRF-TOKEN` / `X-XSRF-TOKEN`
- [ ] `getCsrfCookie()` llamado antes de login/register
- [ ] `me()` llamado en `APP_INITIALIZER` para restaurar sesión al recargar
- [ ] Ruta `/dashboard` existe en Angular para recibir el redirect de Google OAuth
- [ ] Ruta `/login` maneja el query param `?error=cuenta_desactivada`
- [ ] Interceptor de errores maneja 401 → redirect a login
- [ ] `Content-Type: multipart/form-data` para subida de imágenes y CSV (Angular lo gestiona automáticamente con `FormData`)
