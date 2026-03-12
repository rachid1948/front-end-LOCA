import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './auth.service';

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private BASE = `${API_BASE}/maintenances`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> { return this.http.get<any[]>(this.BASE); }
  getByType(type: string): Observable<any[]> { return this.http.get<any[]>(`${this.BASE}/type/${type}`); }
  getByVehicule(vehiculeId: number): Observable<any[]> { return this.http.get<any[]>(`${this.BASE}/vehicule/${vehiculeId}`); }
  create(m: any): Observable<any> { return this.http.post<any>(this.BASE, m); }
  update(id: number, m: any): Observable<any> { return this.http.put<any>(`${this.BASE}/${id}`, m); }
  delete(id: number): Observable<any> { return this.http.delete(`${this.BASE}/${id}`); }
}
