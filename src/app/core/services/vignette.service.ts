import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './auth.service';

@Injectable({ providedIn: 'root' })
export class VignetteService {
  private BASE = `${API_BASE}/vignettes`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> { return this.http.get<any[]>(this.BASE); }
  getByAnnee(annee: number): Observable<any[]> { return this.http.get<any[]>(`${this.BASE}/annee/${annee}`); }
  create(body: any): Observable<any> { return this.http.post<any>(this.BASE, body); }
  update(id: number, body: any): Observable<any> { return this.http.put<any>(`${this.BASE}/${id}`, body); }
  delete(id: number): Observable<any> { return this.http.delete(`${this.BASE}/${id}`); }
}
