import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './auth.service';

@Injectable({ providedIn: 'root' })
export class VehiculeService {
  private BASE = `${API_BASE}/vehicules`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> { return this.http.get<any[]>(this.BASE); }
  getByStatut(statut: string): Observable<any[]> { return this.http.get<any[]>(`${this.BASE}/statut/${statut}`); }
  getDisponibles(dateDepart: string, dateRetour: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/disponibles`, { params: { dateDepart, dateRetour } });
  }
  create(v: any): Observable<any> { return this.http.post<any>(this.BASE, v); }
  update(id: number, v: any): Observable<any> { return this.http.put<any>(`${this.BASE}/${id}`, v); }
  delete(id: number): Observable<any> { return this.http.delete(`${this.BASE}/${id}`); }
  updateStatut(id: number, statut: string): Observable<any> { return this.http.patch(`${this.BASE}/${id}/statut`, { statut }); }
}
