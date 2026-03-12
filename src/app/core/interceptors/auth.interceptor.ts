import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { API_BASE } from '../services/auth.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const token = localStorage.getItem('locadrive_token');
  const http = inject(HttpClient);
  const router = inject(Router);

  // Always send cookies (for HttpOnly refresh token cookie)
  let authReq = req.clone({ withCredentials: true });

  if (token) {
    authReq = authReq.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't attempt refresh on the refresh or login endpoints themselves
      const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');

      if (error.status === 401 && !isAuthEndpoint && !isRefreshing) {
        isRefreshing = true;
        return http.post<{ token: string; username: string; email: string; role: string }>(
          `${API_BASE}/auth/refresh`, {}, { withCredentials: true }
        ).pipe(
          switchMap(res => {
            isRefreshing = false;
            localStorage.setItem('locadrive_token', res.token);
            // Retry the original request with the new token
            const retried = req.clone({
              withCredentials: true,
              setHeaders: { Authorization: `Bearer ${res.token}` }
            });
            return next(retried);
          }),
          catchError(refreshErr => {
            isRefreshing = false;
            localStorage.removeItem('locadrive_token');
            localStorage.removeItem('locadrive_user');
            router.navigate(['/login']);
            return throwError(() => refreshErr);
          })
        );
      }

      return throwError(() => error);
    })
  );
};

