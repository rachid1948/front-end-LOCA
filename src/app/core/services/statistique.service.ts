import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './auth.service';

@Injectable({ providedIn: 'root' })
export class StatistiqueService {
  private BASE = `${API_BASE}/statistiques`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<any> { return this.http.get<any>(this.BASE); }
  getByMonth(year: number, month: number): Observable<any> { return this.http.get<any>(`${this.BASE}/monthly?year=${year}&month=${month}`); }
  getByPeriode(debut: string, fin: string): Observable<any> { return this.http.get<any>(`${this.BASE}/periode?debut=${debut}&fin=${fin}`); }
}
