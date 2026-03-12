import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './auth.service';

@Injectable({ providedIn: 'root' })
export class OperationService {
  private BASE = `${API_BASE}/operations`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> { return this.http.get<any[]>(this.BASE); }
  create(op: any): Observable<any> { return this.http.post<any>(this.BASE, op); }
  update(id: number, op: any): Observable<any> { return this.http.put<any>(`${this.BASE}/${id}`, op); }
  delete(id: number): Observable<any> { return this.http.delete(`${this.BASE}/${id}`); }
  updateStatut(id: number, statut: string): Observable<any> { return this.http.patch(`${this.BASE}/${id}/statut`, { statut }); }
}
