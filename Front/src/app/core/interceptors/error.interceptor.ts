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
          // No redirigir automáticamente aquí, manejar en componentes
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