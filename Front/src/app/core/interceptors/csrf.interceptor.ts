import { HttpInterceptorFn } from '@angular/common/http';

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  // Clona la petición añadiendo withCredentials a TODAS las requests
  const cloned = req.clone({ withCredentials: true });
  return next(cloned);
};