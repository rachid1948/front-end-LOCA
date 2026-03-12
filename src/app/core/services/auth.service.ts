import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export const API_BASE = 'http://localhost:8080/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${API_BASE}/auth/login`, { username, password }, { withCredentials: true }).pipe(
      tap(res => {
        localStorage.setItem('locadrive_token', res.token);
        localStorage.setItem('locadrive_user', JSON.stringify({ username: res.username, role: res.role }));
      })
    );
  }

  refreshToken(): Observable<any> {
    return this.http.post<any>(`${API_BASE}/auth/refresh`, {}, { withCredentials: true }).pipe(
      tap(res => {
        localStorage.setItem('locadrive_token', res.token);
      })
    );
  }

  logout(): void {
    const token = localStorage.getItem('locadrive_token');
    if (token) {
      this.http.post(`${API_BASE}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      }).subscribe({ error: () => {} });
    }
    localStorage.removeItem('locadrive_token');
    localStorage.removeItem('locadrive_user');
  }

  getUser(): { username: string; role: string } | null {
    try {
      const raw = localStorage.getItem('locadrive_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  getRole(): string {
    return this.getUser()?.role ?? '';
  }

  isAdmin(): boolean   { return this.getRole() === 'ADMINISTRATEUR'; }
  isGerant(): boolean  { return this.getRole() === 'GERANT'; }
  isAgent(): boolean   { return this.getRole() === 'AGENT'; }

  canAccessStats(): boolean  { return this.isAdmin() || this.isGerant(); }
  canModifyOps(): boolean    { return this.isAdmin() || this.isGerant(); }
  canAddVehicle(): boolean   { return this.isAdmin(); }
  canManageUsers(): boolean  { return this.isAdmin() || this.isGerant(); }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('locadrive_token');
  }

  getToken(): string | null {
    return localStorage.getItem('locadrive_token');
  }
}

