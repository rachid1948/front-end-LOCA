import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FactureService {
  private BASE = `${API_BASE}/factures`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> { return this.http.get<any[]>(this.BASE); }
  getByNumero(numero: string): Observable<any> { return this.http.get<any>(`${this.BASE}/numero/${numero}`); }
  create(f: any): Observable<any> { return this.http.post<any>(this.BASE, f); }
  delete(id: number): Observable<any> { return this.http.delete(`${this.BASE}/${id}`); }
}
